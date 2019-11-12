      /**************************************************

        This page facilitates rapid visualization of salary
        data. To illustrate, here is the intended use case:

          |------------------------------------------|
          | Atwater Elementary School District will  |          
          | form a yearly committee to evaluate      |      
          | employee requests for reclassification.  |          
          |                                          |                   
          | In 2018, the committee met and discussed |
          | salary comparisons between AESD and      |      
          | other similar and/or competing school    |        
          | districts. The procedure is such that    |        
          | committee members rarely review the      |      
          | salary data beforehand. Thus, I created  |          
          | this page.                               |    
          |                                          | 
          | This tool takes in the salary data       |     
          | of several school districts and allows   |         
          | committee members to quickly generate    |        
          | comparison charts to facilitate          |  
          | discussion. The data are normalized by   |         
          | relative district contributions to       |     
          | healthcare costs, and assumes that       |     
          | STRS/PERS retirement contributions are   |         
          | relative. At its heart, this page is     |       
          | interface for a spreadsheet.             |
          |------------------------------------------|


        Date are provided in a JSON stored in "allClassAndPositions.txt"


        The data in the JSON has the following structure:
          Data
            - District 1
              - Position 1
                - Range
                - Pay: 
                  - [Array of Pay by year. 1 - 35]
              - Position 2
                - Range
                - Pay: 
                  - [Array of Pay by year. 1 - 35]
            - District 2
              - Position 1
                - Range
                - Pay: 
                  - [Array of Pay by year. 1 - 35]
              - Position 2
                - Range
                - Pay: 
                  - [Array of Pay by year. 1 - 35]
      **************************************************/

      //Global variable to store data JSON
      var DATA = {};

      //Global variable that indicates which jobs have been selected
      var SELECTED_JOBS = [];

      //Constant to lock down the maximum years of service we wish to work with
      var YEARS_OF_SERVICE = 35;

      /**************** Variables for the Chart.js chart **************/
      
      //JSON to format and provide to Chart.js
      var CHART_DATA = {};

      //Specified color scheme for chart bars.
      var COLOR_INDEX = 0;
      var COLORS = [
        'FF8C61',
        'CE6A85',
        '985277',
        '33261D',
        '759AAB',
        '197BBD',
        'AD6A6C',
        '89937C',
        '69995D',
        '1E2019',
        'CA9CE1',
        'EF2D56',
        '8CD867',
        '3E8989'
      ]

      //Custom font because I like serif fonts (easier to read)
      Chart.defaults.global.defaultFontFamily = "'Libre Baskerville', serif";

      //Flag for drawing logic.
      var CANVAS_IS_EMPTY = true;

      //Windowing values for the display chart.
      var MAX_DISPLAY_SALARY = 90000
      var MIN_DISPLAY_SALARY = 20000

      $(document).ready(function(){

        //Download and parse our data JSON.
        $.ajax({
          url: "allClassAndPositions.txt",
          type: "get",
          dataType: "text",
          success: function(response) {
            //Process downloaded JSON and store into memory
            DATA = reFormatData(JSON.parse(response));

            //Print the job title options.
            printMenu();
          }
        });

        //Hide the reset button.
        $('#resetBtn').toggle();

        //Draw the chart with our chart data. 
        updateChart();
     
        //The trim button will rewdraw the chart window to reflect max and min pay for a class.
        //this allows for more granular analysis of very low and very high pay scales.
        $('#trimBtn').click(function(){

          //Extreme initial values
          var max = 0;
          var min = 1000000;

          //Find the highest and lowest pay among jobs selected for display.
          for(var s in SELECTED_JOBS){
            max = Math.max(max,DATA[SELECTED_JOBS[s][0]][SELECTED_JOBS[s][1]]['Pay'][YEARS_OF_SERVICE-1])
            min = Math.min(min,DATA[SELECTED_JOBS[s][0]][SELECTED_JOBS[s][1]]['Pay'][0])
          }

          //Bring the display maximum to the nearest $5,000 increments that still contain the data we want.
          MAX_DISPLAY_SALARY = Math.ceil(max / 5000)*5000;
          MIN_DISPLAY_SALARY = Math.floor(min / 5000)*5000;

          //Redraw chart.
          updateChart();

          //Show the reset button.
          $('#resetBtn').toggle();

          //Hide the trim button.
          $('#trimBtn').toggle();
        })

        //Toggle for the reset button.
        $('#resetBtn').click(function(){
          //Hide reset button.
          $('#resetBtn').toggle();
          //Show the trim button.
          $('#trimBtn').toggle();

          //Reset chart window to default values.
          resetChart();
        })
      })

      //Function to reset the data windowing on our chart.
      function resetChart(draw = true){

        //Sanity check to ensure trim button is visible and the reset button is hidden when we're done.
        if($('#resetBtn').is(":visible")){
          $('#resetBtn').toggle();
          $('#trimBtn').toggle();
        }

        //Reset our global values to their default.
        MAX_DISPLAY_SALARY = 90000;
        MIN_DISPLAY_SALARY = 20000;
        YEARS_OF_SERVICE = 35;

        //Redraw the part.
        if(draw){
          updateChart();
        }
      }

      //Add data to our chart in preparation for drawing it.
      function prepareLineChartData(){

        //Label our x axis points by year of service.
        var labl = []
        for(var i = 0; i < YEARS_OF_SERVICE; i++){
          labl.push(String(i+1));
        }

        //Initialize CHART_DATA in preparation for adding datasets.
        CHART_DATA = {
          labels: labl,
          datasets: []
        }

        //Go through our selected jobs and add their salary data to a dataset.
        for(var i in SELECTED_JOBS){

          //shorthand variable name.
          var entry = SELECTED_JOBS[i];

          //Apply our custom color scheme
          var color = entry[2];

          //Add our dataset to the chart.
          CHART_DATA['datasets'].push({
            label: entry[0] + ' - ' + entry[1],
            borderColor: '#' + color,
            backgroundColor: '#' + color,
            fill: false,
            data: DATA[entry[0]][entry[1]]['Pay'],
            yAxisID: 'payAxis'
          });
        }
      }

      //Draw/Redraw our chart using using the global variable settings.
      function updateChart(){

        //Canvas element
        var ctx = document.getElementById('canvas').getContext('2d');

        //Clear the canvas if it has items already
        if(!CANVAS_IS_EMPTY){
          window.myLine.destroy();
        } else {
          CANVAS_IS_EMPTY = false;
        }

        //Prepare chart data for display
        prepareLineChartData();

        //Draw our chart using Chart.js
        window.myLine = Chart.Line(ctx, {
            data: CHART_DATA,
            options: {
                responsive: true,
                hoverMode: 'index',
                stacked: false,
                defaultFontFamily: "'Libre Baskerville', 'serif'",
                title: {
                    display: true,
                    text: 'Normalized, Yearly Salary',
                },
                elements: {
                  line: {
                    tension: 0
                  }
                },
                scales: {
                    yAxes: [{
                        type: 'linear',
                        display: true,
                        position: 'left',
                        id: 'payAxis',
                        scaleLabel: {
                          display: true,
                          labelString: 'Total Pay'
                        },
                        //Draw tick lines every $2500 unless the max pay is high enough to justify $5000
                        ticks: {
                          beginAtZero: false,
                          min: MIN_DISPLAY_SALARY,
                          stepValue: (((MAX_DISPLAY_SALARY - MIN_DISPLAY_SALARY)/2500 < 6) ? 2500 : 5000),
                          max: MAX_DISPLAY_SALARY
                        }
                    }],
                    xAxes: [{
                      scaleLabel: {
                        display: true,
                        labelString: 'Year of Service'
                      }
                    }]

                }
            }
        });
      }


      //Handler for user selection of a job title for comparison.
      function jobSelectParse(id){

        //Clear the chart object of existing data.
        resetChart(false);

        //Reset our color scheme index if needed.
        if(COLOR_INDEX + 1 > COLORS.length){
          COLOR_INDEX = 0;
        }

        //The id variable contains a string formatted to contain the reference information for SELECTED_JOBS
        //This line creates an entry with the DATA indices of the job AND a color to apply the chart line.
        var entry = [id.replace('jobSelect-','').replace('_',' '),$('#' + id).val(),COLORS[COLOR_INDEX++]];

        //Avoid multiple entries for the same job.
        for(var j in SELECTED_JOBS){
          if(SELECTED_JOBS[j][0] === entry[0] && SELECTED_JOBS[j][1] === entry[1]){
            return 0;
          }
        }

        //add the entry to SELECTED_JOBS
        SELECTED_JOBS.push(entry);

        //add this job to the list of selected badges above the menu.
        printBadges();

        //Redraw our chart. 
        updateChart();
      }

      //Print the badges so the user can see which job titles have been selected
      function printBadges(){
        //Badges are dropped into the tagSack for display
        var sack = $('#tagSack');

        //Empty the sack.
        sack.html('');

        //Drop a bootstrap badge into the sack for each Selected job.
        for(var i in SELECTED_JOBS){

          var badge = jQuery('<a/>', {
            class: 'badge progress-bar-dark',
            id: 'jobBadge-' + i,
            onclick: 'removeBadge(' + i + ')', //Handler to remove this badge later.
            html: '&nbsp;' + SELECTED_JOBS[i][0] + ' - ' + SELECTED_JOBS[i][1] + '&nbsp;&nbsp;&nbsp;&nbsp;', //Formatted name
          }).appendTo(sack);

          jQuery('<span/>', {
            class: 'glyphicon glyphicon-remove-sign',
            'aria-hidden': 'true'
          }).appendTo(badge); //Add a remove symbol to signal that the badge can be interacted with.
        }


      }

      //onClick function for badges when the remove icon is clicked. Removes the job from consideration.
      function removeBadge(index){
        //Remove the entry from selected jobs.
        if(index + 1 < SELECTED_JOBS.length){
          //If the removed item is not the last one in the list, slice the entry out of SELECTED_JOBS
          SELECTED_JOBS = SELECTED_JOBS.slice(0,index).concat(SELECTED_JOBS.slice(index+1));          
        } else {
          //If the removed item is the last one on in the list, pop.
          SELECTED_JOBS.pop();
        }

        //add this job to the list of selected badges above the menu.
        printBadges();

        //Redraw our chart. 
        updateChart();
      }

      //This function prints the accordian menu for each job description provided by the DATA JSON.
      function printMenu(){

        /****************************************
          Here is the format for the HTML elements
          in the menu. This function is recreating
          this structure:

          Div .accordian
            - div.panel
              -div.panel-header
                -hf.mb-0
                  -button
            -div.#collapseOne.collapse
              -div.panel-body
                -menu 
            - div.panel
              -div.panel-header
                -hf.mb-0
                  -button
            -div.#collapseOne.collapse
              -div.panel-body
                -menu 
        ****************************************/

        var accordian = jQuery('<div/>', {
          'class': 'accordion',
          'id': 'menuAccordion'
        }).appendTo($('#jobTitlesBody'));

        //Use the keys in DATA for our district names.
        var districts = Object.keys(DATA);
        for(var i in districts){

          //Main Panel
          var panel = jQuery('<div/>', {
            'class': 'panel'
          }).appendTo(accordian);

          /**********Begin Header ***********/
          var panelHeader = jQuery('<div/>', {
            'class': 'panel-header',
            'id': 'heading' + i
          }).appendTo(panel);

          var headline = jQuery('<h5/>', {
            'class': 'mb-0'
          }).appendTo(panelHeader);

          var btn = jQuery('<button/>', {
            'class': 'btn btnPanel btn-block collapsed',
            'type': 'button',
            'data-toggle': 'collapse',
            'data-target': '#collapse' + districts[i].replace(' ','_'),
            'aria-controls': 'collapse' + districts[i].replace(' ','_'),
            'html': districts[i] + ' Jobs'
          }).appendTo(headline);

          /**********Begin Body ***********/

          var bodyDiv = jQuery('<div/>', {
            'id': 'collapse' + districts[i].replace(' ','_'),
            'class': 'collapse show',
            'aria-labelledby': 'heading' + districts[i].replace(' ','_'),
            'data-parent': '#menuAccordion'
          }).appendTo(panel);

          var panelBody = jQuery('<div/>', {
            'class': 'panel-body',
          }).appendTo(bodyDiv);

          var form = jQuery('<form/>').appendTo(panelBody);

          var formGroup = jQuery('<div/>', {
            'class': 'form-group'
          }).appendTo(form);

          var label = jQuery('<label/>', {
            'for': 'jobSelect-' + districts[i].replace(' ','_'),
            'html': 'Choose from ' + districts[i] + ' job titles:'
          }).appendTo(formGroup);

          var jobSelect = jQuery('<select/>', {
            'class': 'form-control',
            'id': 'jobSelect-' + districts[i].replace(' ','_'),
            //onChange triggers the jobSelectParse function to add the description for the chart consideration.
            'onchange': 'jobSelectParse(\'jobSelect-' + districts[i].replace(' ','_') + '\')'
          }).appendTo(formGroup);

          //Create a select optoin for each job description at the district.
          var jobList = Object.keys(DATA[districts[i]]);

          //Sort alphabetically for ease of finding.
          jobList.sort();

          //Add an option for each job title.
          for(var l in jobList){
            jQuery('<option/>', {
              'html': jobList[l]
            }).appendTo(jobSelect);
          }
        }
      }


      //Formats the JSON (a converted CSV) into a more useful structure.
      function reFormatData(data){
        //I should have done this differently. It saved me time in converting the CSV
        //to a JSON in this manner, but at the expense of forcing the client to do so
        //every time they view.

        //Return collector
        ret = {};

        for(var i in data){

          //Examine this line of the spreadsheet for a new district name occurance.
          if(!(data[i]['District'] in ret)){
            //If the district name is new, create a dict entry.
            ret[data[i]['District']] = {};
          }

          //Spreadsheet column to JSON reformatting statements.
          ret[data[i]['District']][data[i]['Position']] = {};
          ret[data[i]['District']][data[i]['Position']]['Range'] = data[i]['Range'];
          ret[data[i]['District']][data[i]['Position']]['Pay'] = [];

          //Add pay data for each position.
          for(var j = 1; j <= YEARS_OF_SERVICE; j++){
            ret[data[i]['District']][data[i]['Position']]['Pay'].push(data[i][j].toFixed(2));
          }
        }

        return ret;
      }