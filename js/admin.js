jQuery(document).ready(function ($) {
    function renderTable(data) {
        let html = '<table><thead><tr><th>Bezeichnung</th><th>Namenszusatz</th><th>Straße</th><th>PLZ</th><th>Altersstufen</th><th>Mail</th><th>Tel</th><th>Web</th><th>Lat</th><th>Lng</th><th>Kathegorie</th><th>ID</th></tr></thead><tbody>';
        
        data.forEach((item, index) => {
          const props = item.properties || {};
          const content = props.content || {};
          const address = content.address || {};
          const coords = item.geometry?.coordinates || ["", ""];
          const contact = content.contact || {};
          const ageGroups = (content.age_groups || []).join(", ");
    
          html += `<tr data-index="${index}">
            <td><input type="text" value="${props.name || ''}" data-key="properties.name"></td>
            <td><input type="text" value="${content.subname || ''}" data-key="properties.content.subname"></td>
            <td><input type="text" value="${address.street || ''}" data-key="properties.content.address.street"></td>
            <td><input type="text" value="${address.postal_code || ''}" data-key="properties.content.address.postal_code"></td>
            <td><input type="text" value="${ageGroups}" data-key="properties.content.age_groups"></td>
            <td><input type="text" value="${contact.mail || ''}" data-key="properties.content.contact.phone"></td>
            <td><input type="text" value="${contact.phone || ''}" data-key="properties.content.contact.mail"></td>
            <td><input type="text" value="${contact.web || ''}" data-key="properties.content.contact.web"></td>
            <td><input type="text" value="${coords[1] || ''}" data-key="geometry.coordinates.1"></td>
            <td><input type="text" value="${coords[0] || ''}" data-key="geometry.coordinates.0"></td>
            <td><input type="text" value="${props.category || ''}" data-key="properties.category"></td>
            <td><input type="text" value="${props.id || ''}" data-key="properties.id"></td>
            </tr>`;
        });
    
        html += '</tbody></table>';
        $('#geojson-editor-container').html(html);
    }
  
    function collectData() {
        const newData = [];
    
        $('#geojson-editor-container tbody tr').each(function () {
          const rowData = {
            type: "Feature",
            properties: {
              name: "",
              content: {
                subname: "",
                address: {
                  street: "",
                  postal_code: ""
                },
                age_groups: [""],
                contact:{
                    mail :"",
                    phone : "",
                    web : ""
                }
              },
              category: "group",
              id: 0
            },
            geometry: {
              type: "Point",
              coordinates: ["", ""]
            }
          };
    
          $(this).find('input').each(function () {
            const path = $(this).data('key').split('.');
            let obj = rowData;
            for (let i = 0; i < path.length - 1; i++) {
              if (!(path[i] in obj)) obj[path[i]] = {};
              obj = obj[path[i]];
            }
    
            const finalKey = path[path.length - 1];
            obj[finalKey] = $(this).val();
          });

          // age_groups als Array umwandeln
        const ageGroupsStr = $(this).find('input[data-key="properties.content.age_groups"]').val() || "";
        rowData.properties.content.age_groups = ageGroupsStr
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    
          // Koordinaten in Zahl konvertieren
          rowData.geometry.coordinates = rowData.geometry.coordinates.map(parseFloat);
    
          newData.push(rowData);
        });
    
        return newData;
      }
    
      renderTable(geojsonData);
    
      $('#save-geojson').click(function () {
        const data = collectData();
    
        $('#save-status').text('Speichern...');
    
        $.post(ajaxurl, {
          action: 'osm_save_json',
          data: JSON.stringify(data)
        }, function (response) {
          if (response.success) {
            $('#save-status').text('Gespeichert!');
          } else {
            $('#save-status').text('Fehler: ' + response.data);
          }
        });
      });
    });