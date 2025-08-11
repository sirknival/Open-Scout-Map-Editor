jQuery(document).ready(function ($) {
    // Daten laden
   $.getScript(OSMGroupTable.dataUrl, function () {
    if (typeof geojsonFeature === 'undefined') {
        console.error("geojsonFeature nicht gefunden!");
        return;
    }

    const rows = geojsonFeature.map(feature => {
        const props = feature.properties;
        
        // Gruppenname + Subname
        let groupName = props.name || '';
        if (props.content?.subname) {
            groupName += ' - ' + props.content.subname;
        }
        groupName = '<span class="highlight-group">' + groupName +'</span>';

        // Altersstufen: Liste in kommaseparierte Strings umwandeln, "Biber" markieren
        let ageGroups = '';
        if (Array.isArray(props.content?.age_groups)) {
            ageGroups = props.content.age_groups.map(age => {
                if (age.toLowerCase() === 'biber') {
                    return `<span class="highlight-biber">${age}</span>`;
                }
                else if (age.toLowerCase() === 'wiwö' || age.toLowerCase() === 'wi' || age.toLowerCase() === 'wö'){
                    return `<span class="highlight-wiwoe">${age}</span>`;
                }
                else if (age.toLowerCase() === 'gusp' || age.toLowerCase() === 'gu' || age.toLowerCase() === 'sp'){
                    return `<span class="highlight-gusp">${age}</span>`;
                }
                else if (age.toLowerCase() === 'caex' || age.toLowerCase() === 'ca' || age.toLowerCase() === 'ex'){
                    return `<span class="highlight-caex">${age}</span>`;
                }
                else if (age.toLowerCase() === 'raro' || age.toLowerCase() === 'ra' || age.toLowerCase() === 'ro'){
                    return `<span class="highlight-raro">${age}</span>`;
                }
                return age;
            }).join('');
        }

        // Website
        let website = props.content?.contact?.web || '';

        return [
            groupName, 
            props.content?.address?.street || '',
            props.content?.address?.postal_code || '',
            ageGroups, 
            website
        ];
    });

    $('#group-table').DataTable({
        data: rows,
        order: [[2, 'asc']],
        pageLength: 30,
        lengthMenu: [ [10, 30, -1], [10, 30, "Alle"] ],
        responsive: true,
        columnDefs: [
            { responsivePriority: 1, targets: 0 }, 
            { responsivePriority: 2, targets: 2 },
            { responsivePriority: 4, targets: 4 },
            { responsivePriority: 9999, targets: 3 },
            { responsivePriority: 10000, targets: 1 }
    ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/de-DE.json'
        },
        columns: [
            { title: "Gruppe" },
            { title: "Adresse" },
            { title: "PLZ" },
            { title: "Altersstufen" },
            { 
                title: "Website", 
                render: function (data) {
                    if (!data) return '';
                    let url = data.startsWith('http') ? data : 'https://' + data;
                    return `<a href="${url}" target="_blank">${data}</a>`;
                }
            }
        ]
    });

        // Filter-Inputs in Kopfzeile einfügen
        /*
        $('#group-table thead tr').clone(true).appendTo('#group-table thead');
        $('#group-table thead tr:eq(1) th').each(function (i) {
            $(this).html('<input type="text" placeholder="Filter..." />');

            $('input', this).on('keyup change', function () {
                if (table.column(i).search() !== this.value) {
                    table.column(i).search(this.value).draw();
                }
            });
        });*/
    });
});
