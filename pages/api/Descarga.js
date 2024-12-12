// pages/api/Descarga.js
import * as XLSX from 'xlsx';

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
            const response = await fetch(`${process.env.API_BASE_URL}${endpoint}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            allData[key] = JSON.parse(text);
        } catch (error) {
            console.error(`Failed to fetch data for ${key}`, error);
            return res.status(500).json({ error: `Failed to fetch data for ${key}` });
        }
    }

    const workbook = XLSX.utils.book_new();

    Object.entries(allData).forEach(([sheetName, data]) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Disposition', 'attachment; filename=disparo_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
}
