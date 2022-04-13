// github api documentation - https://docs.github.com/en/rest/reference/actions
// app script for google sheet documentation - https://developers.google.com/apps-script/reference/spreadsheet

// kumu-qa  api base url 
var api_url = "https://api.github.com/repos/kumumedia/kumu-qa"

// personal access token , go to your github profile -> 
var franz_github_token = "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"

// set the request headers
var options = {
  "method" : "GET",
  "headers" : {
    "Authorization":"token " + franz_github_token, 
    "Accept":"application/vnd.github.everest-preview+json"
  }
};

function main(){
  getHistory_trend()
  sort_sheet()
}

// select the tab on the sheet
var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reports');
// sheet.clearContents()
// get the api endpoint for the file content
var response = UrlFetchApp.fetch(api_url+"/contents/last-history/history-trend.json?ref=allure-reports", options);
var result_data = []

var files = JSON.parse(response.getContentText());

// get the raw content of history-trend.json file and parse into json
var history_trend = UrlFetchApp.fetch(files.download_url)
var history_trend = JSON.parse(history_trend)

function getHistory_trend(buildOrder) {
  // parse the response into json format 
  
  // Logger.log(history_trend)
  // get the latest data on the history file 
  var i = 1
  var passed =  history_trend[i].data.passed;
  var failed =  history_trend[i].data.failed;
  var broken =  history_trend[i].data.broken;
  var skipped =  history_trend[i].data.skipped;
  var unknown =  history_trend[i].data.unknown;
  var total =  history_trend[i].data.total;
  var buildOrder = history_trend[i].buildOrder;
  var reportURl = history_trend[i].reportUrl;

  var total_fails
  var failed_tests = failed + broken + skipped 

  if (failed_tests >= 1 || passed == 0){
    var total_fails = "1"
  }   

  else{
    var total_fails = "0"
  }

  var env = UrlFetchApp.fetch(api_url+"/contents/" + buildOrder+ "/widgets/environment.json?ref=allure-reports", options);
  var env_file = JSON.parse(env.getContentText())
  var raw_env = UrlFetchApp.fetch(env_file.download_url)
  var raw_env = JSON.parse(raw_env)

  var env_val = Object.values(raw_env)[0].values;
  Logger.log(env_val)
  
  result_data.push([buildOrder,passed,failed, broken,skipped,unknown, total, reportURl, total_fails, env_val])
  Logger.log(result_data)

  // sheet.getRange(2, 1, 1, 10).setValues(result_data)
  var s = result_data.toString()
  var s = s.split(",")
  
  // get the date using the get_date() function and passing the buildOrder to the parameter
  var date = get_date(buildOrder)
  var issues = get_Issues(buildOrder)

  sheet.appendRow([s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], date, issues])
  Logger.log("Issues" + issues)

  // assign the reports to specific environment using the split_env_report function 

  split_env_report(env_val,s, date)

  return buildOrder

}

function split_env_report(env_val, s, date){

  var issues = get_Issues(227)
  Logger.log("value of data: " + s)
  var stg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG');
  var prod = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PROD');
  var dev = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DEV');

  if (env_val == "PROD") {
    prod.appendRow([s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], date, issues.toString()])
  }

  if(env_val == "STG"){
    stg.appendRow([s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], date, issues.toString()])
  }

  if(env_val == "DEV"){
    dev.appendRow([s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], date, issues.toString()])
  }
}


function sort_sheet(){
  
  var items = ["STG","PROD", "Reports","DEV"]

  items.forEach(function(value){
    Logger.log(value)
    var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(value)
    var range = ss.getRange("A:K")
    range.sort({column: 1, ascending: false})
  })
}

function get_date(buildOrder){

  var behaviors = UrlFetchApp.fetch(api_url+"/contents/" + buildOrder + "/data/behaviors.json?ref=allure-reports", options);
  var res = JSON.parse(behaviors.getContentText())
  // Logger.log(res)

  var file = UrlFetchApp.fetch(res.download_url)
  var history = JSON.parse(file.getContentText())
  // Logger.log(typeof(history))


  var today = new Date()
  var date = (today.getMonth() + 1 ) + "-" + today.getDate() + "-" + today.getFullYear()

  try{
    var date = history.children[0].children[0].time.start
    var date_str = date.toString()

    var trim_date = date_str.slice(0,10)
    // Logger.log(trim_date)
    var myDate = new Date(trim_date*1000);
    // Logger.log(myDate.toLocaleString()); // 01/10/2020, 10:35:02
    // Logger.log(myDate)
    return myDate
  }
  catch(e){
    Logger.log(e)
    return date
  }
}


function getHistory_loop () { 

  var len =history_trend.length
  Logger.log("history length" + len)
  // var i = l -  1

  for ( i = 0 ; i <= len ; i ++ ){
    var passed =  history_trend[i].data.passed;
    var failed =  history_trend[i].data.failed;
    var broken =  history_trend[i].data.broken;
    var skipped =  history_trend[i].data.skipped;
    var unknown =  history_trend[i].data.unknown;
    var total =  history_trend[i].data.total;
    var buildOrder = history_trend[i].buildOrder;
    var reportURl = history_trend[i].reportUrl;

    Logger.log(buildOrder)
    var failed_tests = failed + broken + skipped 

    if (failed_tests == 0){
        var total_fails = 0
    }
    else{
      var total_fails = 1
    }

    try{  

      var env_val = get_env(buildOrder)
      result_data.push([buildOrder,passed,failed, broken,skipped,unknown, total, reportURl, total_fails, env_val])

      sheet.appendRow([buildOrder,passed,failed, broken,skipped,unknown, total, reportURl, total_fails, env_val])

      var s = result_data[i].toString()
      var s = s.split(",")

      var date = get_date(buildOrder)
      Logger.log("date" + date)
      split_env_report(env_val, s, date)
    }

    catch(e){
      Logger.log(e)
    }
  }    
  // Logger.log(result_data)
}

function get_env(buildOrder){

  var env = UrlFetchApp.fetch(api_url+"/contents/" + buildOrder+ "/widgets/environment.json?ref=allure-reports", options);
  var env_file = JSON.parse(env.getContentText())
  var raw_env = UrlFetchApp.fetch(env_file.download_url)
  var raw_env = JSON.parse(raw_env)

  var env_val = Object.values(raw_env)[0].values;
  Logger.log(env_val)

  return env_val
}

function getBuildOrder(){

  var tab = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('REPORTS');
  var row = tab.getLastRow()
  var col_values = tab.getRange(1,1,row,1).getValues()
  Logger.log(col_values)

// set date per build order 
  col_values.forEach(function(i, index){ 
    Logger.log(index)
    try{
    Logger.log(i + " = "+ get_date(i))
    var date = get_date(i)
    tab.getRange(index + 1 ,11).setValue(date)
    }
    catch(e){
        Logger.log(i +" " + e)
    }

  })

}

function split_env(){
  var sheet1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Copy of Reports 1');
  var values = sheet1.getRange(2, 1, 34, 10).getValues(); // returns 2d array
  var row_data = []

  values.forEach(function(row){
    // Logger.log(row); // prints the contents of the row
    row_data.push(row)
  });

  Logger.log(row_data)
  Logger.log(row_data.length)

  var stg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('STG');
  var prod = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PROD');
  // stg.clearContents()
  // prod.clearContents()

  for (a = 0 ; a <= row_data.length ; a ++) {

    if (row_data[a][0] > 100) {
      prod.appendRow(row_data[a])
    }

    else{
      stg.appendRow(row_data[a])
    }
  }
}

function get_Issues(buildOrder){

  var response = UrlFetchApp.fetch(api_url + "/contents/"  + buildOrder + "/data/suites.json?ref=allure-reports", options)
  var res = JSON.parse(response.getContentText())

  var content = UrlFetchApp.fetch(res.download_url)
  var parse_content = JSON.parse(content)

  // Logger.log(t)

  // get the length of the tests 
  var size = Object.keys(parse_content).length
  Logger.log("length: " + size)
  Logger.log("type: " + typeof(parse_content))
  Logger.log(Object.keys(parse_content).length)

  let uid = Object.values(parse_content)

// error holder 
  let broken = []
  let failed = []
  let test_uid = []
  // get value of each test item
  uid.forEach(function(value, index){
    var test = (value)
      Logger.log(value.status)

      Logger.log("len" + test.length + ", type: " + typeof(test))
      var l = test.length

      for (i= 0; i <= l - 1; i ++ ){
        try{
        Logger.log(test[i].status)
        }
        catch(e){
          Logger.log(e)
        }
        var status =test[i].status 
        var id =test[i].uid 
        if (status == "failed"){
          var mesaggereg =test[i].name
          Logger.log("Test: " + status + ", " + id + ", " + mesaggereg + "uid : " + test[i].uid)
          failed.push(mesaggereg)
          test_uid.push(test[i].uid)
        }

        else if (status == "broken"){
          var mesaggereg =test[i].name
          Logger.log("Test: " + status + ", " + id + ", " + mesaggereg + "uid : " + test[i].uid)
          broken.push(mesaggereg)
          test_uid.push(test[i].uid)
        }

        else{
        Logger.log("Test Passed !! ")
        }
      }
  })
  
  // var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Copy of Reports');
  // sheet.getRange(66,1).setValue(error)
  // Logger.log(Object.values(parse_content)[0])

  Logger.log("broken !!! : " + broken )
  Logger.log("failed Test Cases!!! : " + failed )
  Logger.log("uid's:" + test_uid)


  let issues = []
  if (broken.length == 0 && failed.length == 0) {
      return "There are no issues "
  }
  else{
    return failed
  }
}

































