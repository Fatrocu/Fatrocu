# Desktop integration

The desktop links fatrocu_core from the sibling fatrocu-cli repository. worker.rs owns background jobs; main.rs owns presentation state and user decisions. UI callbacks never perform model requests, source decoding, database operations or file dialogs.

The shared schema and automation API are documented in fatrocu-cli/docs/schema.md and its README. Settings and records use the same SQLite database and managed source directory as the CLI. Revision checks reject stale edits rather than overwriting them. The UI handles remote-transfer consent per import batch and never persists blanket transfer consent.

The server companion manages local runtime/model setup. The updater companion is packaged from the CLI-owned update library; it does not require an independent CLI installation. Both are located next to the desktop executable in release packages. No model weights, credentials, original documents, private labels or telemetry are bundled.
