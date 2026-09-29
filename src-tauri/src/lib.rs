use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "crear_tabla_suplementos",
            sql: "CREATE TABLE IF NOT EXISTS suplementos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                sku TEXT NOT NULL,
                categoria TEXT NOT NULL,
                proveedor TEXT NOT NULL,
                lote TEXT,
                vencimiento TEXT,
                stock INTEGER NOT NULL,
                costo REAL NOT NULL,
                precio REAL NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "crear_tabla_movimientos",
            sql: "CREATE TABLE IF NOT EXISTS movimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku TEXT NOT NULL,
                nombre TEXT NOT NULL,
                lote TEXT,
                tipo TEXT NOT NULL,
                cantidad INTEGER NOT NULL,
                motivo TEXT,
                fecha TEXT NOT NULL
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