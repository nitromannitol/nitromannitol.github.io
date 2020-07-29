
function copy(aObject) {
  if (!aObject) {
    return aObject;
  }

  let v;
  let bObject = Array.isArray(aObject) ? [] : {};
  for (const k in aObject) {
    v = aObject[k];
    bObject[k] = (typeof v === "object") ? copy(v) : v;
  }

  return bObject;
}



function unique ( array ) {
    return array.filter(function(a){
        return !this[a] ? this[a] = true : false;
    }, {});
}



function makeplot() {
   Plotly.d3.csv("model_forecasts.csv", function(data1){ 
    Plotly.d3.csv("model_r.csv", function(data2){ 
      Plotly.d3.csv("total_deaths.csv", function(data3){
      processData(data1,data2,data3)
      });
    });
  });
};


function maketable() {
    // create the table

  var values = [
  ["Ensemble", "Geneva", "IHME", "Imperial", "LANL", "MIT", "USC", "YYG"],
  [2.0, 1.6, 1.0, 0.5, 2.6, 14.7, 1.0, 2.8],[4.9, NaN, 2.3, NaN, 3.3, 30.1, NaN, 4.9],[5.9, NaN, 6.3, NaN, 3.2, 39.5, NaN, 5.9]
  ]

  var headerColor = "grey";
  var rowBestColor = "lightblue";
  var rowWorstColor = "red";
  var rowColor = "white";

  var data = [{
    type: 'table',
    header: {
      values: [["<b>Model</b>"], 
      ["<b>1 week ahead median prediction error</b>"],
      ["<b>2 week ahead median prediction error</b>"], 
      ["<b>3 week ahead median prediction error</b>"]
      ],
      align: "center",
      line: {width: 1, color: 'black'},
      fill: {color: headerColor},
      font: {family: "Arial", size: 13, color: "white"}
    },
    cells: {
      values: values,
      align: "center",
      line: {color: "black", width: 1},
      //fill: {color: [[rowBestColor,rowColor,rowColor,rowColor,
      //          rowColor,rowColor,rowWorstColor]]},
      font: {family: "Arial", size: 12, color: ["black"]}
    }
  }]

  var layout = {
    title: "Historic median prediction errors"
  }

  var config = {responsive: true}


  Plotly.newPlot('tablediv', data, layout, config);


}

function maketable(){
  // create the table

  var values = [
  ["Ensemble", "Geneva", "IHME", "Imperial", "LANL", "MIT", "USC", "YYG"],
  [2.0, 1.6, 1.0, 0.5, 2.6, 14.7, 1.0, 2.8],[4.9, NaN, 2.3, NaN, 3.3, 30.1, NaN, 4.9],[5.9, NaN, 6.3, NaN, 3.2, 39.5, NaN, 5.9]
  ]

  var headerColor = "grey";
  var rowBestColor = "lightblue";
  var rowWorstColor = "red";
  var rowColor = "white";

  var data = [{
    type: 'table',
    header: {
      values: [["<b>Model</b>"], 
      ["<b>1 week ahead median prediction error</b>"],
      ["<b>2 week ahead median prediction error</b>"], 
      ["<b>3 week ahead median prediction error</b>"]
      ],
      align: "center",
      line: {width: 1, color: 'black'},
      fill: {color: headerColor},
      font: {family: "Arial", size: 13, color: "white"}
    },
    cells: {
      values: values,
      align: "center",
      line: {color: "black", width: 1},
      //fill: {color: [[rowBestColor,rowColor,rowColor,rowColor,
      //          rowColor,rowColor,rowWorstColor]]},
      font: {family: "Arial", size: 12, color: ["black"]}
    }
  }]

  var layout = {
    title: "Historic median prediction errors"
  }

  var config = {responsive: true}


  Plotly.newPlot('tablediv', data, layout, config);

};


//https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/ecdc/total_cases_per_million.csv

// data3 is the total deaths repo
  
function processData(data1,data2,data3) {
  var dates = [];
  var total_count = [];
  for (var i=0; i<data3.length; i++) {
    row = data3[i];
    if(row["Kuwait"] > 0){
        total_count.push(row["Kuwait"])
      // console.log(row)
         dates.push( row["date"] );
    };
  }
  //console.log(dates)
  //console.log(total_count)

  var forecast_dates  = [];
  var forecast_titles = [];

  var forecastTitles = d3.keys(data2[0])
 // console.log(forecastTitles)
  date_name = forecastTitles[0];
  forecastTitles = forecastTitles.slice(1,forecastTitles.length+1);
  //console.log(forecastTitles)
  for (var i=0; i<data2.length; i++) {
    row = data2[i];
    forecast_dates.push(row[date_name])
  }
  //console.log(forecast_dates)

  makePlotly(dates,total_count, data1,data2);
}






function generateRPlot(r_data){
//  console.log(r_data)

  curr_model = r_data[0]["model"]
  yy = []
  xx = []
  val2 = 0; 
  data = []; // will hold all the traces


  for(var i = 0; i < r_data.length; i++){
    row = r_data[i]
    model_name = row["model"]
    if(model_name != curr_model){
      //console.log(curr_model)
      // append the data so far to the current frame
       var trace1 = {
          x: xx, 
          y: yy,
          name:  curr_model, 
          mode: 'lines',
          type: 'scatter',
          line: {
          dash: 'dot'
        } 
      };
      data.push(trace1);
      curr_model = model_name
      yy = []
      xx = []
    };
    val2 = Math.max(val2, row["point"])
    yy.push(row["point"])
    xx.push(row["date"])
  };

  // push the last model
  var trace1 = {
  x: xx, 
  y: yy,
  id: 1,
  name:  curr_model,
  mode: 'lines',
  type: 'scatter',
 line: {
      dash: 'dot'
    }
  }
  data.push(trace1);
  val11 = xx[xx.length-1];
  val10 = "2020-03-08"; // first day of reported Rt
  //console.log(data)


  var layout = {
    title: {
      text:'Reproduction number estimates',
      font: {
        family: 'Arial',
        size: 15
      },
      xref: 'paper',
    },

     legend: {
      //orientation: 'd',
      y: 0.5,
      yref: 'paper',
      font: {
        family: 'Arial',
        size: 15
      },
    bgcolor: '#E2E2E2',
    bordercolor: '#FFFFFF',
    borderwidth: 2
    },
  yaxis: {
    title: {
      text: 'Estimated Rt',
      font: {
        family: 'Arial',
        size: 18,
        color: '#7f7f7f'
      }
    }
  }, 
  shapes: [
  ]
  };



  // add vertical line corresponding to update day
  val1 =  { type: 'line',
    x0: val11,
    y0: 0,
    x1: val11,
    y1: val2,
    line: {
      color: 'rgb(1, 1, 1)',
      width: 1
    }
  };

  // add horizontal line corresponding to Rt = 1
  val2 =  { type: 'line',
    x0: val10,
    y0: 1,
    x1: val11,
    y1: 1,
    line: {
      color: 'rgb(0, 0, 1)',
      width: 0.5
    //  dash: 'dash'
    }
  };

  layout.shapes.push(val1)
  layout.shapes.push(val2)
  var config = {responsive: true}


  Plotly.newPlot('rt_div', data, layout, config);
}


function makePlotly(dates, total_count, forecast_data, r_data){
   generateRPlot(r_data)


  // get all unique forecast dates
  // get all unique models
  forecast_dates = []
  model_names = []
  for(var i =0; i < forecast_data.length; i++){
    row = forecast_data[i]; 
    forecast_dates.push(row["forecast_date"]);
    model_names.push(row["model"])
  }
  forecast_dates = unique(forecast_dates).sort()
  model_names = unique(model_names)



  // get Data by  model_name and forecast date
  function getData(model_name, forecast_date,max_pred){
    trace = {
      x:[],
      y:[],
      name:(model_name)
    }
    for(var i = 0; i < forecast_data.length; i++){
      var row = forecast_data[i]
      if(row["model"] == model_name && row["forecast_date"] == forecast_date){;
        trace.x.push(row["target_week_end_date"])
        trace.y.push(row["point"])
        max_pred = Math.max(max_pred, row["point"])
      }
    }
    return {max_pred: max_pred, trace: trace};
  }


 // console.log(getData("IHME", "2020-07-05"))

  var frames = [] 
  for(var ii = 0; ii < forecast_dates.length; ii++){
    var forecast_date = forecast_dates[ii]
    var traces = []
    var max_pred = 0;
    for(var jj = 0; jj < model_names.length; jj++){
      model_name = model_names[jj]
      res = getData(model_name, forecast_date, max_pred)
      curr_trace = res.trace;
       max_pred = Math.max(max_pred, res.max_pred)
      traces.push(curr_trace)
    }
    //console.log(forecast_date)
    //console.log(max_pred)
    // push the data traces

    dates_prev = [];
    y_prev = [];
    y_future = [];
    dates_future = [];


    six_week_date = new Date(forecast_date)
    six_week_date.setDate(six_week_date.getDate()+42)
    six_week_date = six_week_date.toISOString();
    res = six_week_date.split("T")
    six_week_date = res[0]

    six_week_date_pad = new Date(forecast_date)
    six_week_date_pad.setDate(six_week_date_pad.getDate()+45)
    six_week_date_pad = six_week_date_pad.toISOString();
    res = six_week_date_pad.split("T")
    six_week_date_pad = res[0]

    for(jj = 0; jj < dates.length; jj++){
      if(dates[jj] <= forecast_date){
          dates_prev.push(dates[jj])
          y_prev.push(total_count[jj])
        }
      else if (dates[jj] <= six_week_date){
        dates_future.push(dates[jj])
        y_future.push(total_count[jj]) 
      };
    }



    // past cases
    var trace1 = {
      x: dates_prev.slice(),
      y: y_prev.slice(),
      name: "Reported",
      showlegend: false,
      type: 'scatter',
      mode: 'lines',
      line: {
        color: "black",
        width: 3
      }
    }
    traces.push(trace1)

    // future cases
    var trace2 = {
      x: dates_future.slice(),
      y: y_future.slice(),
      showlegend: false,
      name: "Future reported",
      type: 'scatter',
      mode: 'lines',
      line: {
        color: "gray",
        width: 1,
        dash: 'dashdot'
      }
    };
    traces.push(trace2)
    max_pred = Math.max(max_pred, y_future[y_future.length-1])

    // line marking current day
    var trace3 = {
      x: [forecast_date, forecast_date], 
      y: [0, (y_prev.slice())[y_prev.length-1]],
      mode: 'lines',
      type: 'scatter',
      showlegend: false,
      hoverinfo: 'skip',
      line: {
        color: "black",
        width: 0.5
      }
    }
    traces.push(trace3)

    //console.log(forecast_date)
    //console.log(max_pred)

     var layout = {
    title: {
        text:'COVID-19 Kuwait National Forecasts',
        font: {
          family: 'Arial',
          size: 24
        },
        xref: 'paper',
      },
       legend: {
          y: 0.5,
          yref: 'paper',
          font: {
            family: 'Arial',
            size: 15
          },
        bgcolor: '#E2E2E2',
        bordercolor: '#FFFFFF',
        borderwidth: 2
      },
      yaxis: {
        range: [0, max_pred+20],
        showgrid: true,
        title: {
      text: 'Cumulative detected deaths',
      font: {
        family: 'Arial',
        size: 18,
        color: '#7f7f7f'
      }
    }
      },
      sliders: [{
      active:ii,
      currentvalue: {
        visible: true,
        prefix: 'Forecast week: ',
        xanchor: 'left',
        font: {size: 20, color: '#666'}
      },
      steps: sliderSteps
    }]
    }


    curr_frame = {name:ii, data:traces, layout:layout};
    frames.push(curr_frame)
  }




  //initialize the sliderSteps
  var sliderSteps = [];
    for (ii = 0; ii < forecast_dates.length; ii++) {
      sliderSteps.push({
        method: 'animate',
        label: forecast_dates[ii],
        args: [[ii], {
          frame: {duration: 100, redraw: true, mode: "immediate"},
        }]
      });
    }

//console.log(frames[0])






  // Create the plot starting at the 
  // last slider must copy otherwise problems happen!
  data_copy = copy(frames[frames.length-1].data)
  layout_copy = copy(frames[frames.length-1].layout)

   var layout = {
    title: {
        text:'COVID-19 Kuwait National Forecasts',
        font: {
          family: 'Arial',
          size: 24
        },
        xref: 'paper',
      },
       legend: {
          y: 0.5,
          yref: 'paper',
          font: {
            family: 'Arial',
            size: 15
          },
        bgcolor: '#E2E2E2',
        bordercolor: '#FFFFFF',
        borderwidth: 2
      },
      yaxis: {
        //range: [0, max_pred+20],
        showgrid: true,
        title: {
      text: 'Cumulative detected deaths',
      font: {
        family: 'Arial',
        size: 18,
        color: '#7f7f7f'
      }
    }
      },
      sliders: [{
      active:sliderSteps.length-1,
      currentvalue: {
        visible: true,
        prefix: 'Forecast week: ',
        xanchor: 'left',
        font: {size: 20, color: '#666'}
      },
      steps: sliderSteps
    }]
    }


  var config = {responsive: true}


  Plotly.newPlot('forecast_div', {
    data: data_copy, 
    layout: layout,
    frames: frames,
    config
  });

};

