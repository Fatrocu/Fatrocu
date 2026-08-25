use crate::models::{InvoiceConfig, ProcessedInvoice};
use rust_xlsxwriter::{Color, Format, FormatBorder, Workbook};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::path::Path;

pub struct ExcelExporter;

impl ExcelExporter {
    pub fn export_to_excel(
        invoices: &[ProcessedInvoice],
        configs: &[InvoiceConfig],
        output_path: &Path,
    ) -> Result<(), String> {
        let mut workbook = Workbook::new();
        let worksheet = workbook.add_worksheet();
        worksheet.set_name("Faturalar").map_err(|e| e.to_string())?;

        let config_map: HashMap<String, &InvoiceConfig> =
            configs.iter().map(|c| (c.id.clone(), c)).collect();

        // 1. Collect all header mappings
        let mut main_field_order: Vec<String> = vec!["Dosya Adı".to_string()];
        let mut main_field_labels: HashMap<String, String> = HashMap::new();
        main_field_labels.insert("fileName".to_string(), "Dosya Adı".to_string());

        let mut line_field_order: Vec<String> = Vec::new();
        let mut line_field_labels: HashMap<String, String> = HashMap::new();

        let mut seen_main_keys = HashSet::new();
        let mut seen_line_keys = HashSet::new();

        for inv in invoices {
            if let Some(cfg) = config_map.get(&inv.config_id) {
                for f in &cfg.fields {
                    if seen_main_keys.insert(f.key.clone()) {
                        main_field_order.push(f.label.clone());
                        main_field_labels.insert(f.key.clone(), f.label.clone());
                    }
                }
                if let Some(line_fields) = &cfg.line_item_fields {
                    for lf in line_fields {
                        if seen_line_keys.insert(lf.key.clone()) {
                            line_field_order.push(lf.label.clone());
                            line_field_labels.insert(lf.key.clone(), lf.label.clone());
                        }
                    }
                }
            }

            if let Some(custom_fields) = &inv.custom_fields {
                for cf in custom_fields {
                    if seen_main_keys.insert(cf.key.clone()) {
                        main_field_order.push(cf.label.clone());
                        main_field_labels.insert(cf.key.clone(), cf.label.clone());
                    }
                }
            }

            if let Some(custom_line_fields) = &inv.custom_line_item_fields {
                for clf in custom_line_fields {
                    if seen_line_keys.insert(clf.key.clone()) {
                        line_field_order.push(clf.label.clone());
                        line_field_labels.insert(clf.key.clone(), clf.label.clone());
                    }
                }
            }
        }

        let mut all_headers = main_field_order.clone();
        all_headers.extend(line_field_order.clone());

        // 2. Format Definitions
        let header_format = Format::new()
            .set_bold()
            .set_font_color(Color::RGB(0xFFFFFF))
            .set_background_color(Color::RGB(0x2B4C7E))
            .set_border(FormatBorder::Thin);

        let cell_format = Format::new().set_border(FormatBorder::Thin);

        // 3. Write Headers
        for (col_idx, header) in all_headers.iter().enumerate() {
            worksheet
                .write_string_with_format(0, col_idx as u16, header, &header_format)
                .map_err(|e| e.to_string())?;
        }

        // 4. Write Rows
        let mut row_idx: u32 = 1;
        let mut col_max_len: Vec<usize> = all_headers.iter().map(|h| h.len()).collect();

        for inv in invoices {
            let extracted = match &inv.extracted_data {
                Some(data) => data,
                None => continue,
            };

            let mut base_row_data: HashMap<String, String> = HashMap::new();
            base_row_data.insert("Dosya Adı".to_string(), inv.file_name.clone());

            for (key, label) in &main_field_labels {
                if key == "fileName" {
                    continue;
                }
                let val = extracted
                    .get(key)
                    .and_then(|gv| gv.value.clone())
                    .unwrap_or_default();
                base_row_data.insert(label.clone(), val);
            }

            if let Some(line_items) = &inv.line_items {
                if !line_items.is_empty() {
                    for item in line_items {
                        let mut full_row_data = base_row_data.clone();
                        for (key, label) in &line_field_labels {
                            let val = item
                                .get(key)
                                .and_then(|gv| gv.value.clone())
                                .unwrap_or_default();
                            full_row_data.insert(label.clone(), val);
                        }

                        for (col_idx, header) in all_headers.iter().enumerate() {
                            let val = full_row_data.get(header).cloned().unwrap_or_default();
                            if val.len() > col_max_len[col_idx] {
                                col_max_len[col_idx] = val.len();
                            }
                            worksheet
                                .write_string_with_format(row_idx, col_idx as u16, &val, &cell_format)
                                .map_err(|e| e.to_string())?;
                        }
                        row_idx += 1;
                    }
                    continue;
                }
            }

            // Single row if no line items
            for (col_idx, header) in all_headers.iter().enumerate() {
                let val = base_row_data.get(header).cloned().unwrap_or_default();
                if val.len() > col_max_len[col_idx] {
                    col_max_len[col_idx] = val.len();
                }
                worksheet
                    .write_string_with_format(row_idx, col_idx as u16, &val, &cell_format)
                    .map_err(|e| e.to_string())?;
            }
            row_idx += 1;
        }

        // 5. Adjust column widths
        for (col_idx, max_len) in col_max_len.iter().enumerate() {
            let width = (*max_len as f64 + 4.0).max(14.0);
            worksheet
                .set_column_width(col_idx as u16, width)
                .map_err(|e| e.to_string())?;
        }

        // Enable autofilter
        if row_idx > 1 && !all_headers.is_empty() {
            let _ = worksheet.autofilter(0, 0, row_idx - 1, (all_headers.len() - 1) as u16);
        }

        workbook.save(output_path).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn export_to_csv(
        invoices: &[ProcessedInvoice],
        configs: &[InvoiceConfig],
        output_path: &Path,
    ) -> Result<(), String> {
        let file = File::create(output_path).map_err(|e| e.to_string())?;
        let mut writer = csv::Writer::from_writer(file);

        let config_map: HashMap<String, &InvoiceConfig> =
            configs.iter().map(|c| (c.id.clone(), c)).collect();

        let mut main_field_order: Vec<String> = vec!["Dosya Adı".to_string()];
        let mut main_field_labels: HashMap<String, String> = HashMap::new();
        let mut line_field_order: Vec<String> = Vec::new();
        let mut line_field_labels: HashMap<String, String> = HashMap::new();
        let mut seen_main = HashSet::new();
        let mut seen_line = HashSet::new();

        for inv in invoices {
            if let Some(cfg) = config_map.get(&inv.config_id) {
                for f in &cfg.fields {
                    if seen_main.insert(f.key.clone()) {
                        main_field_order.push(f.label.clone());
                        main_field_labels.insert(f.key.clone(), f.label.clone());
                    }
                }
                if let Some(lines) = &cfg.line_item_fields {
                    for lf in lines {
                        if seen_line.insert(lf.key.clone()) {
                            line_field_order.push(lf.label.clone());
                            line_field_labels.insert(lf.key.clone(), lf.label.clone());
                        }
                    }
                }
            }
        }

        let mut all_headers = main_field_order.clone();
        all_headers.extend(line_field_order.clone());

        writer.write_record(&all_headers).map_err(|e| e.to_string())?;

        for inv in invoices {
            let extracted = match &inv.extracted_data {
                Some(data) => data,
                None => continue,
            };

            let mut base_row_data: HashMap<String, String> = HashMap::new();
            base_row_data.insert("Dosya Adı".to_string(), inv.file_name.clone());

            for (key, label) in &main_field_labels {
                let val = extracted
                    .get(key)
                    .and_then(|gv| gv.value.clone())
                    .unwrap_or_default();
                base_row_data.insert(label.clone(), val);
            }

            if let Some(line_items) = &inv.line_items {
                if !line_items.is_empty() {
                    for item in line_items {
                        let mut full_row = base_row_data.clone();
                        for (key, label) in &line_field_labels {
                            let val = item
                                .get(key)
                                .and_then(|gv| gv.value.clone())
                                .unwrap_or_default();
                            full_row.insert(label.clone(), val);
                        }
                        let record: Vec<String> = all_headers
                            .iter()
                            .map(|h| full_row.get(h).cloned().unwrap_or_default())
                            .collect();
                        writer.write_record(&record).map_err(|e| e.to_string())?;
                    }
                    continue;
                }
            }

            let record: Vec<String> = all_headers
                .iter()
                .map(|h| base_row_data.get(h).cloned().unwrap_or_default())
                .collect();
            writer.write_record(&record).map_err(|e| e.to_string())?;
        }

        writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    }
}
