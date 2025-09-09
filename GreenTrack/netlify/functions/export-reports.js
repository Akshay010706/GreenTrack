import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function convertToCSV(data) {
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => JSON.stringify(row[header])).join(','));
    return [headers.join(','), ...rows].join('\n');
}

exports.handler = async function(event, context) {
    try {
        const { data, error } = await supabase.from('reports').select('*');

        if (error) {
            throw error;
        }

        const csv = convertToCSV(data);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename=reports.csv',
            },
            body: csv,
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
