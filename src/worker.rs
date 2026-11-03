use anyhow::{Context, Result, ensure};
use eframe::egui;
use fatrocu_core::{
    export::{self, ExportFormat},
    extraction,
    inference::Endpoint,
    model::*,
    storage::{Settings, Store},
    update::{self, Release},
};
use std::{
    path::PathBuf,
    process::{Child, Command},
    sync::mpsc::{Receiver, Sender},
};

#[derive(Clone)]
pub struct Snapshot {
    pub profiles: Vec<Profile>,
    pub templates: Vec<Template>,
    pub documents: Vec<Document>,
    pub settings: Settings,
}
pub enum Job {
    Reload,
    PickFiles,
    Import {
        files: Vec<PathBuf>,
        profile: String,
        template: String,
        kind: DocumentKind,
        merge: bool,
        no_model: bool,
        endpoint: Endpoint,
        consent: bool,
    },
    Profile {
        name: String,
        tax_id: String,
    },
    RenameProfile {
        id: String,
        name: String,
    },
    DeleteProfile(String),
    Template(Template),
    Settings(Settings),
    Review(Document),
    Approve(Document, Vec<String>),
    Reopen(String, u64),
    Delete(String, u64),
    Preview {
        id: String,
        page: u32,
    },
    Export {
        ids: Vec<String>,
        format: ExportFormat,
    },
    Backup,
    ConnectionCheck,
    CheckUpdate,
    InstallUpdate(Release),
    SetupServer,
    StartServer,
    StopServer,
}
pub enum Event {
    Snapshot(Box<Snapshot>, String),
    Error(String),
    Files(Vec<PathBuf>),
    Preview {
        id: String,
        page: u32,
        page_count: u32,
        image: Option<egui::ColorImage>,
        text: String,
    },
    Update(Release),
    Close,
    Message(String),
}
pub fn start(root: PathBuf, ctx: egui::Context, jobs: Receiver<Job>, events: Sender<Event>) {
    std::thread::spawn(move || {
        let send = |event| {
            let _ = events.send(event);
            ctx.request_repaint();
        };
        let mut store = match Store::open(&root) {
            Ok(s) => s,
            Err(e) => {
                send(Event::Error(format!("Cannot open local data: {e:#}")));
                return;
            }
        };
        let mut server: Option<Child> = None;
        for job in jobs {
            let result = (|| -> Result<String> {
                match job {
                    Job::Reload => {}
                    Job::PickFiles => {
                        if let Some(files) = rfd::FileDialog::new()
                            .add_filter(
                                "Documents",
                                &["pdf", "png", "jpg", "jpeg", "xml", "html", "htm", "txt"],
                            )
                            .pick_files()
                        {
                            send(Event::Files(files));
                        }
                        return Ok("__file_selection__".into());
                    }
                    Job::Import {
                        files,
                        profile,
                        template,
                        kind,
                        merge,
                        no_model,
                        endpoint,
                        consent,
                    } => {
                        let profile = store.profile(&profile)?;
                        let template = store.template(&template)?;
                        let mut errors = vec![];
                        let mut count = 0;
                        for (index, file) in files.iter().enumerate() {
                            send(Event::Message(format!(
                                "Processing document {} of {}...",
                                index + 1,
                                files.len()
                            )));
                            match extraction::extract(
                                file, &profile, &template, kind, &endpoint, consent, !no_model,
                            )
                            .and_then(|mut d| {
                                d.merge_taxes = merge;
                                store.import(file, d)
                            }) {
                                Ok(_) => count += 1,
                                Err(e) => errors.push(format!("Document {}: {e:#}", index + 1)),
                            }
                        }
                        if !errors.is_empty() {
                            send(Event::Error(format!(
                                "Imported {count} documents. {}",
                                errors.join("; ")
                            )));
                        }
                        return Ok(format!("Imported {count} documents for review"));
                    }
                    Job::Profile { name, tax_id } => {
                        store.save_profile(&Profile::new(name, tax_id)?)?
                    }
                    Job::RenameProfile { id, name } => {
                        let mut p = store.profile(&id)?;
                        p.legal_name = name;
                        store.save_profile(&p)?;
                    }
                    Job::DeleteProfile(id) => store.delete_profile(&id)?,
                    Job::Template(t) => store.save_template(&t)?,
                    Job::Settings(s) => store.save_settings(&s)?,
                    Job::Review(mut d) => store.review(&mut d)?,
                    Job::Approve(mut d, ack) => {
                        store.review(&mut d)?;
                        let issues = d.issues();
                        let ack: Vec<_> = ack
                            .into_iter()
                            .filter(|path| {
                                issues.iter().any(|i| i.path == *path && i.acknowledgeable)
                            })
                            .collect();
                        store.approve(&d.id, d.revision, &ack)?;
                    }
                    Job::Reopen(id, revision) => {
                        store.reopen(&id, revision)?;
                    }
                    Job::Delete(id, revision) => store.delete(&id, revision)?,
                    Job::Preview { id, page } => {
                        let path = store.source(&id)?;
                        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
                        let temp = tempfile::tempdir()?;
                        let image_path = if ext == "pdf" {
                            let target = temp.path().join("preview.png");
                            extraction::render_page(&path, page, &target)?;
                            Some(target)
                        } else if matches!(ext, "png" | "jpg" | "jpeg") {
                            Some(path.clone())
                        } else {
                            None
                        };
                        let (image, text) = if let Some(path) = image_path {
                            let image = image::ImageReader::open(path)?
                                .with_guessed_format()?
                                .decode()?
                                .to_rgba8();
                            let dimensions = [image.width() as usize, image.height() as usize];
                            (
                                Some(egui::ColorImage::from_rgba_unmultiplied(
                                    dimensions,
                                    image.as_raw(),
                                )),
                                String::new(),
                            )
                        } else {
                            (None, std::fs::read_to_string(&path)?)
                        };
                        send(Event::Preview {
                            page_count: extraction::page_count(&path)?,
                            id,
                            page,
                            image,
                            text,
                        });
                        return Ok("Source loaded".into());
                    }
                    Job::Export { ids, format } => {
                        ensure!(!ids.is_empty(), "Select approved documents first");
                        let extension = match format {
                            ExportFormat::Xlsx => "xlsx",
                            ExportFormat::Csv => "csv",
                            ExportFormat::Json => "json",
                        };
                        if let Some(path) = rfd::FileDialog::new()
                            .set_file_name(format!("Fatrocu-export.{extension}"))
                            .add_filter(extension, &[extension])
                            .save_file()
                        {
                            let documents = ids
                                .iter()
                                .map(|id| store.document(id))
                                .collect::<Result<Vec<_>>>()?;
                            export::export(&documents, format, &path)?;
                            return Ok(format!(
                                "Exported {} documents to {}",
                                documents.len(),
                                path.display()
                            ));
                        }
                    }
                    Job::Backup => {
                        if let Some(parent) = rfd::FileDialog::new()
                            .set_title("Choose a parent folder for a new backup")
                            .pick_folder()
                        {
                            let name = format!(
                                "Fatrocu-backup-{}",
                                std::time::SystemTime::now()
                                    .duration_since(std::time::UNIX_EPOCH)?
                                    .as_secs()
                            );
                            store.backup(&parent.join(name))?;
                        }
                    }
                    Job::ConnectionCheck => {
                        store.settings()?.endpoint.health()?;
                        return Ok("Model connection is healthy".into());
                    }
                    Job::CheckUpdate => {
                        let release = update::check("Fatrocu", &root.join("updates"), true)?;
                        if update::newer(&release, env!("CARGO_PKG_VERSION"))? {
                            send(Event::Update(release));
                        } else {
                            return Ok("You are using the latest stable release".into());
                        }
                    }
                    Job::InstallUpdate(release) => {
                        let staged = update::stage(&release, true)?;
                        let executable = std::env::current_exe()?;
                        update::launch_helper(
                            &staged,
                            executable.parent().context("Missing installation folder")?,
                            Some(&executable),
                        )?;
                        send(Event::Close);
                    }
                    Job::SetupServer => {
                        let executable = companion_server()?;
                        send(Event::Message("Downloading and verifying llama.cpp, the model and projector. This can take several minutes.".into()));
                        let mut command = Command::new(executable);
                        command.args(["setup", "--no-start"]);
                        hide(&mut command);
                        ensure!(
                            command.status()?.success(),
                            "Local model setup failed; use fatrocu-server setup in a terminal for details"
                        );
                    }
                    Job::StartServer => {
                        ensure!(
                            server
                                .as_mut()
                                .is_none_or(|s| s.try_wait().ok().flatten().is_some()),
                            "Model server is already running"
                        );
                        let mut command = Command::new(companion_server()?);
                        command.arg("start");
                        hide(&mut command);
                        server = Some(command.spawn()?);
                        return Ok(
                            "Model server started; check connection after it has loaded".into()
                        );
                    }
                    Job::StopServer => {
                        if let Some(mut child) = server.take() {
                            stop_server(&mut child);
                        }
                        return Ok("Model server stopped".into());
                    }
                }
                Ok("Saved".into())
            })();
            match result {
                Ok(message) if message == "__file_selection__" => {}
                Ok(message) => match snapshot(&store) {
                    Ok(s) => send(Event::Snapshot(Box::new(s), message)),
                    Err(e) => send(Event::Error(format!("{e:#}"))),
                },
                Err(e) => send(Event::Error(format!("{e:#}"))),
            }
        }
        if let Some(mut child) = server {
            stop_server(&mut child);
        }
    });
}
fn stop_server(child: &mut Child) {
    #[cfg(windows)]
    {
        if child.try_wait().ok().flatten().is_none() {
            let mut command = Command::new("taskkill.exe");
            command.args(["/PID", &child.id().to_string(), "/T", "/F"]);
            hide(&mut command);
            let _ = command.status();
        }
    }
    let _ = child.kill();
    let _ = child.wait();
}
fn snapshot(store: &Store) -> Result<Snapshot> {
    Ok(Snapshot {
        profiles: store.profiles()?,
        templates: store.templates()?,
        documents: store.documents()?,
        settings: store.settings()?,
    })
}
fn hide(command: &mut Command) {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    let _ = command;
}
fn companion_server() -> Result<PathBuf> {
    let exe = std::env::current_exe()?;
    let path = exe
        .parent()
        .context("Missing executable directory")?
        .join("fatrocu-server.exe");
    ensure!(
        path.is_file(),
        "Place fatrocu-server.exe beside the desktop executable, or run fatrocu-server setup separately"
    );
    Ok(path)
}
