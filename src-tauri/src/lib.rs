use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "crear_tabla_suplementos",
            sql: "CREATE TABLE IF NOT EXISTS supplements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                sku TEXT NOT NULL,
                category TEXT NOT NULL,
                supplier TEXT NOT NULL,
                batch TEXT,
                expiry_date TEXT,
                stock INTEGER NOT NULL,
                cost REAL NOT NULL,
                price REAL NOT NULL
            );",
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:suplementos.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error mientras se ejecutaba tauri");
}