#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#[cfg(not(windows))]
compile_error!("Fatrocu desktop is supported on Windows only. Use fatrocu-cli on Linux.");
mod worker;
use eframe::egui;
use fatrocu_core::{
    export::ExportFormat,
    model::*,
    storage::Settings,
    update::{self, Release},
};
use std::{collections::BTreeSet, path::PathBuf, sync::mpsc};
use worker::{Event, Job, Snapshot};

fn main() -> eframe::Result {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1320.0, 850.0])
            .with_min_inner_size([980.0, 680.0])
            .with_drag_and_drop(true),
        ..Default::default()
    };
    eframe::run_native(
        "Fatrocu 3.1",
        options,
        Box::new(|cc| Ok(Box::new(App::new(cc)))),
    )
}
#[derive(Default, PartialEq)]
enum Page {
    #[default]
    Dashboard,
    Review,
    Approved,
    Settings,
}
struct App {
    page: Page,
    tx: mpsc::Sender<Job>,
    rx: mpsc::Receiver<Event>,
    snapshot: Snapshot,
    status: String,
    error: String,
    busy: bool,
    profile: String,
    template: String,
    kind: DocumentKind,
    merge: bool,
    no_model: bool,
    settings: Settings,
    profile_name: String,
    profile_tax_id: String,
    template_draft: Template,
    new_key: String,
    new_label: String,
    editing: Option<Document>,
    selected: BTreeSet<String>,
    ack: BTreeSet<String>,
    dirty: bool,
    preview: Option<egui::TextureHandle>,
    source_text: String,
    preview_page: u32,
    preview_pages: u32,
    selected_region: Option<Region>,
    pending_files: Option<Vec<PathBuf>>,
    consent_endpoint: Option<fatrocu_core::inference::Endpoint>,
    release: Option<Release>,
    delete_confirmation: Option<(String, u64)>,
    pending_review: Option<Document>,
}
impl App {
    fn new(cc: &eframe::CreationContext<'_>) -> Self {
        let (tx, jobs) = mpsc::channel();
        let (events, rx) = mpsc::channel();
        let root = fatrocu_core::storage::default_data_dir()
            .unwrap_or_else(|_| PathBuf::from("Fatrocu-data"));
        worker::start(root.clone(), cc.egui_ctx.clone(), jobs, events.clone());
        let context = cc.egui_ctx.clone();
        std::thread::spawn(move || {
            if let Ok(release) = update::check("Fatrocu", &root.join("updates"), false)
                && update::newer(&release, env!("CARGO_PKG_VERSION")).unwrap_or(false)
            {
                let _ = events.send(Event::Update(release));
                context.request_repaint();
            }
        });
        let _ = tx.send(Job::Reload);
        let settings = Settings::default();
        let mut template_draft = Template::builtin(DocumentKind::EArchive);
        template_draft.id = "custom_invoice".into();
        template_draft.name = "Custom invoice".into();
        template_draft.builtin = false;
        Self {
            page: Page::Dashboard,
            tx,
            rx,
            snapshot: Snapshot {
                profiles: vec![],
                templates: vec![],
                documents: vec![],
                settings: settings.clone(),
            },
            status: "Loading local workspace...".into(),
            error: if std::env::args().any(|a| a == "--update-failed") {
                "Update installation failed. Check the installation or retry from Settings.".into()
            } else {
                String::new()
            },
            busy: true,
            profile: String::new(),
            template: "e_archive".into(),
            kind: DocumentKind::EArchive,
            merge: true,
            no_model: false,
            settings,
            profile_name: String::new(),
            profile_tax_id: String::new(),
            template_draft,
            new_key: String::new(),
            new_label: String::new(),
            editing: None,
            selected: BTreeSet::new(),
            ack: BTreeSet::new(),
            dirty: false,
            preview: None,
            source_text: String::new(),
            preview_page: 1,
            preview_pages: 1,
            selected_region: None,
            pending_files: None,
            consent_endpoint: None,
            release: None,
            delete_confirmation: None,
            pending_review: None,
        }
    }
    fn send(&mut self, job: Job) {
        if self.tx.send(job).is_ok() {
            self.busy = true;
            self.error.clear();
            self.status = "Working...".into();
        } else {
            self.error = "Background worker stopped. Restart the application.".into();
        }
    }
    fn events(&mut self, ctx: &egui::Context) {
        while let Ok(event) = self.rx.try_recv() {
            match event {
                Event::Snapshot(snapshot, message) => {
                    self.busy = false;
                    self.settings = snapshot.settings.clone();
                    if !snapshot.profiles.iter().any(|p| p.id == self.profile) {
                        self.profile = snapshot
                            .profiles
                            .first()
                            .map(|p| p.id.clone())
                            .unwrap_or_default();
                    }
                    self.selected.retain(|id| {
                        snapshot.documents.iter().any(|d| {
                            d.id == *id
                                && d.profile_id == self.profile
                                && d.status == ReviewStatus::Approved
                        })
                    });
                    if let Some(d) = &mut self.editing {
                        if let Some(latest) = snapshot.documents.iter().find(|v| v.id == d.id) {
                            if latest.revision != d.revision {
                                *d = latest.clone();
                                self.dirty = false;
                                self.ack.clear();
                            }
                        } else {
                            self.editing = None;
                        }
                    }
                    self.snapshot = *snapshot;
                    self.status = message;
                }
                Event::Error(error) => {
                    self.error = error;
                    self.busy = false;
                }
                Event::Files(files) => {
                    self.busy = false;
                    self.import(files);
                }
                Event::Preview {
                    id,
                    page,
                    page_count,
                    image,
                    text,
                } => {
                    self.busy = false;
                    if self.editing.as_ref().is_some_and(|d| d.id == id)
                        && self.preview_page == page
                    {
                        self.preview = image.map(|im| {
                            ctx.load_texture(
                                format!("{id}-{page}"),
                                im,
                                egui::TextureOptions::LINEAR,
                            )
                        });
                        self.source_text = text;
                        self.preview_pages = page_count;
                    }
                }
                Event::Update(release) => {
                    self.release = Some(release);
                }
                Event::Close => ctx.send_viewport_cmd(egui::ViewportCommand::Close),
                Event::Message(message) => self.status = message,
            }
        }
    }
    fn import(&mut self, files: Vec<PathBuf>) {
        if self.profile.is_empty() {
            self.error = "Create and select a taxpayer profile before importing documents.".into();
            return;
        }
        if files.is_empty() {
            return;
        }
        let endpoint = self.snapshot.settings.endpoint.clone();
        if endpoint.is_remote() && !self.no_model {
            self.pending_files = Some(files);
            self.consent_endpoint = Some(endpoint);
        } else {
            self.import_with(files, endpoint, false);
        }
    }
    fn import_with(
        &mut self,
        files: Vec<PathBuf>,
        endpoint: fatrocu_core::inference::Endpoint,
        consent: bool,
    ) {
        self.send(Job::Import {
            files,
            profile: self.profile.clone(),
            template: self.template.clone(),
            kind: self.kind,
            merge: self.merge,
            no_model: self.no_model,
            endpoint,
            consent,
        });
    }
    fn open_review(&mut self, d: Document) {
        if self.dirty {
            self.pending_review = Some(d);
            return;
        }
        self.preview = None;
        self.source_text.clear();
        self.preview_page = 1;
        self.preview_pages = 1;
        self.selected_region = None;
        self.ack.clear();
        self.dirty = false;
        let id = d.id.clone();
        self.editing = Some(d);
        self.page = Page::Review;
        self.send(Job::Preview { id, page: 1 });
    }
    fn dashboard(&mut self, ui: &mut egui::Ui) {
        ui.heading("Import documents");
        ui.label(
            "Choose a taxpayer and template, extract, then review each document before export.",
        );
        ui.add_space(16.0);
        egui::ComboBox::from_label("Taxpayer")
            .selected_text(
                self.snapshot
                    .profiles
                    .iter()
                    .find(|p| p.id == self.profile)
                    .map(|p| p.legal_name.as_str())
                    .unwrap_or("Select a profile"),
            )
            .show_ui(ui, |ui| {
                for p in &self.snapshot.profiles {
                    ui.selectable_value(
                        &mut self.profile,
                        p.id.clone(),
                        format!("{} · {}", p.legal_name, p.tax_id),
                    );
                }
            });
        egui::ComboBox::from_label("Template")
            .selected_text(
                self.snapshot
                    .templates
                    .iter()
                    .find(|t| t.id == self.template)
                    .map(|t| t.name.as_str())
                    .unwrap_or("Select a template"),
            )
            .show_ui(ui, |ui| {
                for t in &self.snapshot.templates {
                    if ui
                        .selectable_value(&mut self.template, t.id.clone(), &t.name)
                        .clicked()
                    {
                        self.kind = t.family;
                    }
                }
            });
        if self.kind != DocumentKind::EArchive {
            ui.horizontal(|ui| {
                ui.selectable_value(&mut self.kind, DocumentKind::ZReport, "Z report");
                ui.selectable_value(&mut self.kind, DocumentKind::Utts, "UTTS / fuel slip");
            });
        }
        ui.checkbox(
            &mut self.merge,
            "Merge tax rows with the same type and rate",
        );
        ui.checkbox(
            &mut self.no_model,
            "Manual / deterministic import without model inference",
        );
        ui.add_space(12.0);
        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.set_min_height(150.0);
            ui.vertical_centered(|ui| {
                ui.add_space(20.0);
                ui.heading("Drop PDF, XML, HTML, JPG or PNG files here");
                ui.label(
                    "Original files and work records stay on this device until you delete them.",
                );
                if ui
                    .add_enabled(!self.busy, egui::Button::new("Choose documents"))
                    .clicked()
                {
                    self.send(Job::PickFiles);
                }
                ui.add_space(20.0);
            });
        });
        ui.add_space(20.0);
        ui.heading("Needs review");
        let docs: Vec<_> = self
            .snapshot
            .documents
            .iter()
            .filter(|d| d.profile_id == self.profile && d.status == ReviewStatus::Review)
            .cloned()
            .collect();
        if docs.is_empty() {
            ui.label("No documents waiting for review.");
        }
        for d in docs {
            ui.horizontal(|ui| {
                ui.label(&d.file_name);
                ui.label(format!("{} review issues", d.issues().len()));
                if ui
                    .add_enabled(!self.busy, egui::Button::new("Review"))
                    .clicked()
                {
                    self.open_review(d);
                }
            });
        }
    }
    fn source_panel(&mut self, ui: &mut egui::Ui) {
        ui.heading("Source document");
        ui.horizontal(|ui| {
            if ui
                .add_enabled(
                    !self.busy && self.preview_page > 1,
                    egui::Button::new("Previous page"),
                )
                .clicked()
            {
                self.preview_page -= 1;
                self.preview = None;
                if let Some(d) = &self.editing {
                    self.send(Job::Preview {
                        id: d.id.clone(),
                        page: self.preview_page,
                    });
                }
            }
            ui.label(format!(
                "Page {} of {}",
                self.preview_page, self.preview_pages
            ));
            if ui
                .add_enabled(
                    !self.busy && self.preview_page < self.preview_pages,
                    egui::Button::new("Next page"),
                )
                .clicked()
            {
                self.preview_page += 1;
                self.preview = None;
                if let Some(d) = &self.editing {
                    self.send(Job::Preview {
                        id: d.id.clone(),
                        page: self.preview_page,
                    });
                }
            }
        });
        egui::ScrollArea::both().show(ui, |ui| {
            if let Some(texture) = &self.preview {
                let size = texture.size_vec2();
                let width = ui.available_width().max(100.0);
                let response = ui.add(
                    egui::Image::new((texture.id(), size))
                        .fit_to_exact_size(egui::vec2(width, width * size.y / size.x)),
                );
                if let Some(r) = &self.selected_region
                    && r.page == self.preview_page
                {
                    let rect = egui::Rect::from_min_size(
                        response.rect.min
                            + egui::vec2(r.x * response.rect.width(), r.y * response.rect.height()),
                        egui::vec2(
                            r.width * response.rect.width(),
                            r.height * response.rect.height(),
                        ),
                    );
                    ui.painter().rect_stroke(
                        rect,
                        1.0,
                        egui::Stroke::new(2.0, egui::Color32::from_rgb(220, 85, 45)),
                        egui::StrokeKind::Inside,
                    );
                }
            } else if !self.source_text.is_empty() {
                ui.add(egui::Label::new(&self.source_text).selectable(true));
            } else {
                ui.label("Loading preview. PDF preview requires Poppler (pdftoppm) on PATH.");
            }
        });
        if self.selected_region.is_none() {
            ui.label("No source coordinates were extracted for the selected field.");
        }
    }
    fn review(&mut self, ui: &mut egui::Ui) {
        let Some(mut d) = self.editing.take() else {
            ui.label("Select a document from Upload or Approved.");
            return;
        };
        ui.heading(&d.file_name);
        ui.label(format!("{:?} · revision {}", d.kind, d.revision));
        let editable = d.status == ReviewStatus::Review;
        ui.add_enabled_ui(editable && !self.busy, |ui| {
            let template = self
                .snapshot
                .templates
                .iter()
                .find(|t| t.id == d.template_id);
            for (key, field) in &mut d.fields {
                let label = if key == "document_number" && d.kind != DocumentKind::EArchive {
                    "Z number".into()
                } else {
                    template
                        .and_then(|t| t.fields.get(key))
                        .cloned()
                        .unwrap_or_else(|| key.clone())
                };
                ui.label(label);
                let (changed, focused, region) = edit_field(ui, field, key != "direction");
                self.dirty |= changed;
                if focused {
                    self.selected_region = region;
                }
            }
            ui.separator();
            ui.heading("Taxes");
            self.dirty |= ui
                .checkbox(
                    &mut d.merge_taxes,
                    "Merge same-type, same-rate rows in export",
                )
                .changed();
            ui.label(
                "Edit original source rows below; changing the merge view never discards them.",
            );
            let mut remove = None;
            for (i, tax) in d.taxes.iter_mut().enumerate() {
                ui.push_id(i, |ui| {
                    ui.horizontal(|ui| {
                        ui.label(format!("Row {}", i + 1));
                        if ui.button("Remove row").clicked() {
                            remove = Some(i);
                            self.dirty = true;
                        }
                    });
                    for (label, field) in [
                        ("Tax type", &mut tax.tax_type),
                        ("Rate", &mut tax.rate),
                        ("Base", &mut tax.base),
                        ("Amount", &mut tax.amount),
                    ] {
                        ui.horizontal(|ui| {
                            ui.label(label);
                            let (changed, focused, region) = edit_field(ui, field, true);
                            self.dirty |= changed;
                            if focused {
                                self.selected_region = region;
                            }
                        });
                    }
                    ui.separator();
                });
            }
            if let Some(i) = remove {
                d.taxes.remove(i);
            }
            if ui.button("Add tax row").clicked() {
                d.taxes.push(TaxRow {
                    tax_type: Field::new(None),
                    rate: Field::new(None),
                    base: Field::new(None),
                    amount: Field::new(None),
                });
                self.dirty = true;
            }
            if d.merge_taxes {
                match d.tax_view() {
                    Ok(rows) => {
                        ui.label(format!("Merged export contains {} tax rows", rows.len()));
                        for tax in rows {
                            ui.label(format!(
                                "{} · {}% · base {} · tax {}",
                                tax.tax_type.text(),
                                tax.rate.text(),
                                tax.base.text(),
                                tax.amount.text()
                            ));
                        }
                    }
                    Err(e) => {
                        ui.colored_label(egui::Color32::RED, e.to_string());
                    }
                }
            }
        });
        if editable {
            ui.separator();
            for issue in d.issues() {
                if issue.acknowledgeable {
                    let mut accepted = self.ack.contains(&issue.path);
                    if ui
                        .checkbox(
                            &mut accepted,
                            format!("Acknowledge {}: {}", issue.path, issue.message),
                        )
                        .changed()
                    {
                        if accepted {
                            self.ack.insert(issue.path);
                        } else {
                            self.ack.remove(&issue.path);
                        }
                    }
                } else {
                    ui.colored_label(
                        egui::Color32::RED,
                        format!("{}: {}", issue.path, issue.message),
                    );
                }
            }
            ui.horizontal(|ui| {
                if ui
                    .add_enabled(!self.busy, egui::Button::new("Save corrections"))
                    .clicked()
                {
                    self.send(Job::Review(d.clone()));
                }
                if ui
                    .add_enabled(
                        !self.busy,
                        egui::Button::new("Save and approve this document"),
                    )
                    .clicked()
                {
                    self.send(Job::Approve(d.clone(), self.ack.iter().cloned().collect()));
                }
            });
        } else {
            ui.label("Approved");
            if ui
                .add_enabled(!self.busy, egui::Button::new("Send back to review"))
                .clicked()
            {
                self.send(Job::Reopen(d.id.clone(), d.revision));
            }
        }
        if ui
            .add_enabled(!self.busy, egui::Button::new("Delete this document"))
            .clicked()
        {
            self.delete_confirmation = Some((d.id.clone(), d.revision));
        }
        if let Some(region) = &self.selected_region
            && region.page != self.preview_page
            && !self.busy
        {
            self.preview_page = region.page;
            self.preview = None;
            self.send(Job::Preview {
                id: d.id.clone(),
                page: self.preview_page,
            });
        }
        self.editing = Some(d);
    }
    fn approved(&mut self, ui: &mut egui::Ui) {
        ui.heading("Approved documents");
        let docs: Vec<_> = self
            .snapshot
            .documents
            .iter()
            .filter(|d| d.profile_id == self.profile && d.status == ReviewStatus::Approved)
            .cloned()
            .collect();
        self.selected.retain(|id| docs.iter().any(|d| d.id == *id));
        ui.horizontal(|ui| {
            if ui.button("Select all").clicked() {
                self.selected = docs.iter().map(|d| d.id.clone()).collect();
            }
            if ui.button("Clear selection").clicked() {
                self.selected.clear();
            }
        });
        for d in docs {
            ui.horizontal(|ui| {
                let mut selected = self.selected.contains(&d.id);
                if ui
                    .checkbox(
                        &mut selected,
                        format!("{} · {}", d.file_name, d.value("gross_total")),
                    )
                    .changed()
                {
                    if selected {
                        self.selected.insert(d.id.clone());
                    } else {
                        self.selected.remove(&d.id);
                    }
                }
                if ui
                    .add_enabled(!self.busy, egui::Button::new("View"))
                    .clicked()
                {
                    self.open_review(d.clone());
                }
                if ui
                    .add_enabled(!self.busy, egui::Button::new("Back to review"))
                    .clicked()
                {
                    self.send(Job::Reopen(d.id.clone(), d.revision));
                }
                if ui
                    .add_enabled(!self.busy, egui::Button::new("Delete"))
                    .clicked()
                {
                    self.delete_confirmation = Some((d.id, d.revision));
                }
            });
        }
        ui.separator();
        if ui
            .add_enabled(
                !self.busy && !self.selected.is_empty(),
                egui::Button::new(format!(
                    "Export selected ({})",
                    self.snapshot.settings.default_export
                )),
            )
            .clicked()
            && let Ok(format) = self.snapshot.settings.default_export.parse()
        {
            self.send(Job::Export {
                ids: self.selected.iter().cloned().collect(),
                format,
            });
        }
        ui.horizontal(|ui| {
            for (name, format) in [
                ("Export Excel", ExportFormat::Xlsx),
                ("Export CSV", ExportFormat::Csv),
                ("Export JSON", ExportFormat::Json),
            ] {
                if ui
                    .add_enabled(
                        !self.busy && !self.selected.is_empty(),
                        egui::Button::new(name),
                    )
                    .clicked()
                {
                    self.send(Job::Export {
                        ids: self.selected.iter().cloned().collect(),
                        format,
                    });
                }
            }
        });
    }
    fn settings(&mut self, ui: &mut egui::Ui) {
        ui.heading("Settings / About");
        ui.horizontal(|ui| {
            ui.label("Provider protocol");
            ui.selectable_value(
                &mut self.settings.endpoint.protocol,
                fatrocu_core::inference::Protocol::OpenAiCompatible,
                "OpenAI compatible",
            );
            ui.selectable_value(
                &mut self.settings.endpoint.protocol,
                fatrocu_core::inference::Protocol::Anthropic,
                "Claude Messages",
            );
        });
        ui.label("Fatrocu 3.1 · local document workspace");
        ui.collapsing("Taxpayer profiles", |ui| {
            ui.label("Legal name");
            ui.text_edit_singleline(&mut self.profile_name);
            ui.label("VKN/TCKN");
            ui.text_edit_singleline(&mut self.profile_tax_id);
            if ui
                .add_enabled(!self.busy, egui::Button::new("Create taxpayer"))
                .clicked()
            {
                self.send(Job::Profile {
                    name: self.profile_name.clone(),
                    tax_id: self.profile_tax_id.clone(),
                });
            }
            for p in self.snapshot.profiles.clone() {
                ui.horizontal(|ui| {
                    ui.label(format!("{} · {}", p.legal_name, p.tax_id));
                    if ui.button("Select").clicked() {
                        self.profile = p.id.clone();
                    }
                    if ui
                        .add_enabled(!self.busy, egui::Button::new("Rename using name above"))
                        .clicked()
                    {
                        self.send(Job::RenameProfile {
                            id: p.id.clone(),
                            name: self.profile_name.clone(),
                        });
                    }
                    if ui
                        .add_enabled(!self.busy, egui::Button::new("Delete unused profile"))
                        .clicked()
                    {
                        self.send(Job::DeleteProfile(p.id));
                    }
                });
            }
        });
        ui.separator();
        ui.label("Model API endpoint (HTTP/OpenAI compatible)");
        ui.text_edit_singleline(&mut self.settings.endpoint.url);
        ui.label("Model ID");
        ui.text_edit_singleline(&mut self.settings.endpoint.model);
        let mut key = self
            .settings
            .endpoint
            .api_key_env
            .clone()
            .unwrap_or_default();
        ui.label("Credential environment variable name (leave blank for local use)");
        if ui.text_edit_singleline(&mut key).changed() {
            self.settings.endpoint.api_key_env = if key.is_empty() { None } else { Some(key) };
        }
        if self.settings.endpoint.is_remote() {
            ui.colored_label(
                egui::Color32::from_rgb(200, 100, 20),
                self.settings.endpoint.disclosure(),
            );
        }
        egui::ComboBox::from_label("Default export")
            .selected_text(&self.settings.default_export)
            .show_ui(ui, |ui| {
                for format in ["xlsx", "csv", "json"] {
                    ui.selectable_value(&mut self.settings.default_export, format.into(), format);
                }
            });
        ui.checkbox(
            &mut self.settings.telemetry_enabled,
            "Enable local telemetry preference",
        );
        ui.label("Telemetry package collection is pending the contents/deletion policy decision. No package is collected, uploaded or deleted.");
        ui.horizontal(|ui| {
            if ui
                .add_enabled(!self.busy, egui::Button::new("Save settings"))
                .clicked()
            {
                self.send(Job::Settings(self.settings.clone()));
            }
            if ui
                .add_enabled(!self.busy, egui::Button::new("Check model connection"))
                .clicked()
            {
                self.send(Job::ConnectionCheck);
            }
            if ui
                .add_enabled(!self.busy, egui::Button::new("Back up local data"))
                .clicked()
            {
                self.send(Job::Backup);
            }
        });
        ui.collapsing("Local llama.cpp setup",|ui|{ui.label("The companion fatrocu-server downloads verified CPU runtime, Qwen model and visual projector. Local access only by default. Use its terminal advanced setup to host other computers.");ui.horizontal(|ui|{if ui.add_enabled(!self.busy,egui::Button::new("Install local model")).clicked(){self.send(Job::SetupServer);}
if ui.add_enabled(!self.busy,egui::Button::new("Start model")).clicked(){self.send(Job::StartServer);}
if ui.add_enabled(!self.busy,egui::Button::new("Stop model")).clicked(){self.send(Job::StopServer);}});});
        ui.collapsing("Custom template editor", |ui| {
            ui.label("Start from a built-in family and add named scalar fields.");
            ui.horizontal(|ui| {
                for kind in [DocumentKind::EArchive, DocumentKind::ZReport] {
                    if ui
                        .selectable_label(self.template_draft.family == kind, format!("{kind:?}"))
                        .clicked()
                    {
                        self.template_draft = Template::builtin(kind);
                        self.template_draft.builtin = false;
                        self.template_draft.id = "custom_template".into();
                        self.template_draft.name = "Custom template".into();
                    }
                }
            });
            ui.label("Template ID");
            ui.text_edit_singleline(&mut self.template_draft.id);
            ui.label("Template name");
            ui.text_edit_singleline(&mut self.template_draft.name);
            for (key, label) in &mut self.template_draft.fields {
                ui.horizontal(|ui| {
                    ui.label(key);
                    ui.text_edit_singleline(label);
                });
            }
            ui.label("New field key / label");
            ui.horizontal(|ui| {
                ui.text_edit_singleline(&mut self.new_key);
                ui.text_edit_singleline(&mut self.new_label);
                if ui.button("Add field").clicked() {
                    self.template_draft
                        .fields
                        .insert(self.new_key.clone(), self.new_label.clone());
                    self.new_key.clear();
                    self.new_label.clear();
                }
            });
            if ui
                .add_enabled(!self.busy, egui::Button::new("Save custom template"))
                .clicked()
            {
                self.send(Job::Template(self.template_draft.clone()));
            }
        });
        ui.separator();
        if ui
            .add_enabled(!self.busy, egui::Button::new("Check for updates"))
            .clicked()
        {
            self.send(Job::CheckUpdate);
        }
        if let Some(release) = self.release.clone() {
            ui.label(format!("New stable release: {}", release.tag_name));
            ui.label(release.body.clone().unwrap_or_default());
            if ui
                .add_enabled(!self.busy, egui::Button::new("Update"))
                .clicked()
            {
                self.send(Job::InstallUpdate(release));
            }
        }
    }
}
fn edit_field(
    ui: &mut egui::Ui,
    field: &mut Field,
    editable: bool,
) -> (bool, bool, Option<Region>) {
    let mut value = field.text().to_owned();
    let response = ui.add_enabled(
        editable,
        egui::TextEdit::singleline(&mut value).desired_width(280.0),
    );
    let changed = response.changed();
    if changed {
        field.value = if value.trim().is_empty() {
            None
        } else {
            Some(value)
        };
        field.needs_review = field.value.is_none();
    }
    let region = if response.has_focus() || response.clicked() {
        field.source.clone()
    } else {
        None
    };
    (changed, response.has_focus() || response.clicked(), region)
}
impl eframe::App for App {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        let ctx = ui.ctx().clone();
        self.events(&ctx);
        egui::Panel::top("navigation").show(ui, |ui| {
            ui.horizontal(|ui| {
                ui.heading("FATROCU");
                for (page, name) in [
                    (Page::Dashboard, "Upload"),
                    (Page::Review, "Review"),
                    (Page::Approved, "Approved"),
                    (Page::Settings, "Settings / About"),
                ] {
                    ui.selectable_value(&mut self.page, page, name);
                }
                if self.busy {
                    ui.spinner();
                }
                if self.release.is_some() {
                    ui.label("Update available in Settings");
                }
            });
        });
        egui::Panel::bottom("status").show(ui, |ui| {
            ui.label(&self.status);
            if !self.error.is_empty() {
                ui.colored_label(egui::Color32::RED, &self.error);
            }
        });
        if self.page == Page::Review {
            egui::Panel::left("source")
                .default_size(540.0)
                .resizable(true)
                .show(ui, |ui| self.source_panel(ui));
        }
        egui::CentralPanel::default().show(ui, |ui| {
            egui::ScrollArea::vertical()
                .id_salt("main")
                .show(ui, |ui| match self.page {
                    Page::Dashboard => self.dashboard(ui),
                    Page::Review => self.review(ui),
                    Page::Approved => self.approved(ui),
                    Page::Settings => self.settings(ui),
                });
        });
        let dropped = ctx.input(|i| {
            i.raw
                .dropped_files
                .iter()
                .map(|f| f.path().to_owned())
                .collect::<Vec<_>>()
        });
        if !dropped.is_empty() {
            if self.busy {
                self.error = "Wait for the current operation before dropping files.".into();
            } else {
                self.import(dropped);
            }
        }
        if self.pending_files.is_some() {
            egui::Window::new("External document transfer")
                .collapsible(false)
                .resizable(false)
                .show(&ctx, |ui| {
                    ui.set_max_width(500.0);
                    if let Some(endpoint) = &self.consent_endpoint {
                        ui.label(endpoint.disclosure());
                    }
                    ui.horizontal(|ui| {
                        if ui.button("Send these documents").clicked()
                            && let (Some(files), Some(endpoint)) =
                                (self.pending_files.take(), self.consent_endpoint.take())
                        {
                            self.import_with(files, endpoint, true);
                        }
                        if ui.button("Cancel").clicked() {
                            self.pending_files = None;
                            self.consent_endpoint = None;
                        }
                    });
                });
        }
        if let Some(document) = self.pending_review.clone() {
            egui::Window::new("Unsaved corrections")
                .collapsible(false)
                .show(&ctx, |ui| {
                    ui.label(
                        "Save your corrections before switching, or discard the unsaved changes.",
                    );
                    if ui.button("Keep editing").clicked() {
                        self.page = Page::Review;
                        self.pending_review = None;
                    }
                    if ui.button("Discard changes and open document").clicked() {
                        self.dirty = false;
                        self.pending_review = None;
                        self.open_review(document);
                    }
                });
        }
        if let Some((id, revision)) = self.delete_confirmation.clone() {
            egui::Window::new("Delete document permanently?")
                .collapsible(false)
                .show(&ctx, |ui| {
                    ui.label(
                        "This deletes the retained original and work record from this device.",
                    );
                    ui.horizontal(|ui| {
                        if ui.button("Delete original and record").clicked() {
                            self.send(Job::Delete(id.clone(), revision));
                            self.delete_confirmation = None;
                            self.selected.remove(&id);
                        }
                        if ui.button("Cancel").clicked() {
                            self.delete_confirmation = None;
                        }
                    });
                });
        }
    }
}
