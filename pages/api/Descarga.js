// pages/api/Descarga.js
import * as XLSX from 'xlsx';
import axios from 'axios';

export default async function handler(req, res) {
    const endpoints = {
        "M Actualizado": "/api/MActualizado",
        "M Enviados": "/api/MEnviado",
        "Viper Actualizado": "/api/ViperActualizado",
        "Viper Enviado": "/api/ViperEnviado",
        "Boa Actualizado": "/api/BoaActualizado",
        "Boa Enviado": "/api/BoaEnviado",
    };

    const allData = {};

    for (const [key, endpoint] of Object.entries(endpoints)) {
        try {
            const response = await axios.get(`${process.env.API_BASE_URL}${endpoint}`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allData[key] = response.data;
        } catch (error) {
            console.error(`Failed to fetch data for ${key}`, error);
            return res.status(500).json({ error: `Failed to fetch data for ${key}` });
        }
    }

    const workbook = XLSX.utils.book_new();

    Object.entries(allData).forEach(([sheetName, data]) => {
        // Convertir los datos en una hoja de cálculo
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Eliminar columnas específicas
        const colsToDelete = ['ID', 'Cambios', 'Colors']; // reemplaza con los nombres de columnas que quieras eliminar
        colsToDelete.forEach(col => {
            const colLetter = getColumnLetter(worksheet, col);
            if (colLetter) {
                deleteColumn(worksheet, colLetter);
            }
        });

        // Aplicar estilos a los headers
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1"; // Primera fila
            if (!worksheet[address]) continue;
            worksheet[address].s = {
                fill: {
                    fgColor: { rgb: "FFFF00" } // Color de fondo amarillo
                },
                font: {
                    bold: true,
                    color: { rgb: "FF0000" } // Color de fuente rojo
                }
            };
        }

        // Agregar la hoja de cálculo al libro de trabajo
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', 'attachment; filename=disparo_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
}

function getColumnLetter(worksheet, colName) {
    const headers = Object.keys(worksheet)
        .filter(key => key.startsWith('!') === false)
        .reduce((acc, key) => {
            const col = key.replace(/\d+/, '');
            if (!acc[col]) acc[col] = worksheet[key].v;
            return acc;
        }, {});
    return Object.keys(headers).find(col => headers[col] === colName) || null;
}

function deleteColumn(worksheet, colLetter) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = colLetter + (R + 1);
        delete worksheet[cellAddress];
    }
    // Update worksheet range
    if (range.e.c > range.s.c) {
        range.e.c--;
        worksheet['!ref'] = XLSX.utils.encode_range(range);
    }
}
