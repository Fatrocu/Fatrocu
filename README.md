# Fatrocu Desktop 3.1

Native Windows Rust application using egui/eframe 0.37. Document extraction, validation, taxpayer direction, storage, approval and exports are owned by the shared fatrocu_core library in the sibling fatrocu-cli repository. There is no Tauri, web frontend or dependency on a CLI installed on PATH.

## Build

Keep Fatrocu, fatrocu-cli and fatrocu-server as sibling repository checkouts. Use the exact core revision in core-revision.txt and the server revision in server-revision.txt. Then:

```text
cargo build --locked
cargo run --locked
cargo test --locked --all-targets
cargo clippy --locked --all-targets -- -D warnings
```

The supported desktop platform is Windows. PDF rendering requires Poppler pdftoppm on PATH; PDF text extraction is built into the Rust core. Optional pdftotext adds exact source-word coordinates. PNG/JPEG previews require no helper. The learning example in the parent workspace uses the same pinned eframe version and interaction APIs.

For integrated model management, build fatrocu-server.exe and place it next to fatrocu.exe. The signed production package also includes fatrocu-updater.exe built from fatrocu-cli. The desktop directly links the core; the CLI executable is unnecessary. Local model setup downloads the runtime, default Qwen model and visual projector outside the installation. The model starts with loopback access only. Advanced models and hosting are available through the server terminal onboarding.

## Workflow

1. Settings / About: create a taxpayer with legal name and VKN/TCKN, then choose it on Upload.
2. Choose e-Archive or OKC, select Z report/UTTS for OKC, and choose the tax merge preference.
3. Drop multiple documents or choose files. Model work, parsing, database operations, file dialogs, image decoding and network calls run on a background worker.
4. Review the actual source on the left and editable fields/original tax rows on the right. Select a field to highlight its extracted region. No highlight is fabricated when evidence is unavailable. PDF pages can be navigated.
5. Correct extracted values, resolve review issues or individually acknowledge missing source values, then approve that document. Nothing is automatically approved.
6. Approved: select records, export to Excel/CSV/JSON, send a record back to review, or delete its retained original and record after the application's confirmation.

Source legal names remain in their original language. Unreadable fields remain blank/null with needs_review; missing numbers and taxes are never guessed. e-Archive direction follows the active taxpayer match. OKC displays Z number, and only UTTS requires a plate. Original rows survive changing the merge setting.

Settings also expose export defaults, custom templates, local/remote model connections, connection checks, backups and version checks. Credentials are read from a named environment variable, never saved in settings. Non-loopback inference shows the exact external destination and requires the user to choose Send these documents before transmission. Redirects cannot silently transfer a document to another endpoint.

Originals and records live in application data until deletion. FATROCU_DATA_DIR can select a separate workspace outside Git; the CLI uses the same format. Backups create a fresh directory with SQLite plus retained sources.

Telemetry preference defaults to enabled, but package contents and purge behavior remain undecided. Collection, upload and purge are deferred; the UI says so explicitly.

## Releases and current gates

Startup release checks are asynchronous; Settings / About provides Check for updates. Stable releases come from Fatrocu/Fatrocu on GitHub. Release notes and version are shown before the user chooses Update. The helper verifies GitHub's SHA-256 digest and the independently confirmed publisher certificate, stages files, closes the desktop, installs with rollback and relaunches. User data stays outside the replaceable installation. The project publisher identity and signed installation validation remain pending; missing trust causes a safe refusal. See the core repository's docs/releases.md for the portable ZIP contract.

Windows native UI validation exercised Upload, source/field review, correction, individual approval, Approved actions and a JSON export using isolated synthetic data. Core tests cover all three output formats. Real Standard model installation and local API connectivity were also exercised. **Extraction benchmark: NOT RUN (dataset pending)**. No feature PR opens until both private template gates pass, and no PR is merged.
