const puppeteer = require('puppeteer');
const Candidate = require('./models/candidateModel');

function scrapeNow() {

  //Scraper function
  async function runScraper() {
    //Launch the headless browser
    const browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      headless: false
    });

    const page = await browser.newPage();
    process.on("unhandledRejection", (reason, p) => {
      console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
      browser.close();
    });


    //Navigate to our site
    await page.goto('https://panchayatelection.maharashtra.gov.in/MasterSearch.aspx');
    //Select 'MUNIC'L CORPORATION' as LocalBody
    await page.select('#ContentPlaceHolder1_SearchControl1_DDLLocalBody', '5');
    await page.waitFor(1000);
    //await page.click('#ContentPlaceHolder1_SearchControl1_DDLLocalBody > button');
    //Select 'Konkan' as Division
    await page.select('#ContentPlaceHolder1_SearchControl1_DDLDivision', '6');
    await page.waitFor(1000)
    //Select 'Mumbai City' as District
    await page.select('#ContentPlaceHolder1_SearchControl1_DDLDistrict', '519');
    await page.waitFor(1000);
    //Select 'BruhanMumbai Mahanagar Palika | MP' as Municipal Corporation Name
    await page.select('#ContentPlaceHolder1_SearchControl1_DDLMunicipalcorporation', '429');
    await page.waitFor(1000);
    //Select 'BruhanMumbai Mahanagar Palika' as Election Programe Name
    await page.select('#ContentPlaceHolder1_SearchControl1_ddlEP', '20');
    await page.waitFor(1000);
    //Select '1' as Ward
    await page.select('#ContentPlaceHolder1_SearchControl1_DDLWARDGP', '3542');
    //Finally click on Search button 
    await page.click('#ContentPlaceHolder1_btnSearch');
    //Wait for results to load in datatable
    await page.waitFor(3000);

    arrayCandidateResults = [];

    let candidateListLength = await page.evaluate((sel) => {
      let candidateListSelectorID = document.getElementById(sel);
      let candidateSelectorTagName = candidateListSelectorID.getElementsByTagName('tr');
      return candidateSelectorTagName.length;
    }, 'ContentPlaceHolder1_GVData');

    for (let i = 2; i <= candidateListLength; i++) {
      let candidateSelector = `#ContentPlaceHolder1_GVData  > tbody > tr:nth-child(${i})`;

      let candidateListing = await page.evaluate((sel) => {
        console.log(document.querySelector(sel));
        return document.querySelector(sel).innerText;
      }, candidateSelector);

      arrayCandidateResults.push(candidateListing);
    }

    browser.close();
    return arrayCandidateResults;
  }

  //After successfull scraping
  runScraper().then((values) => {
    let arrCandidates = values;

    arrCandidates.forEach((candidate) => {
      let myCandidate = candidate.split('\t');

      let newCandidate = new Candidate({
        sr_no: myCandidate[0],
        registration_no: myCandidate[1],
        full_name: myCandidate[2]
      })

      Candidate.addCandidate(newCandidate, function (err, callback) {
        if (err) {
          console.log(`Unable to add Candidate!`);

          // res.json({
          //   'success': false,
          //   'message': 'Unable to register User!'
          // })
        } else {
          console.log(`Candidate added successfully.`);

          // res.json({
          //   'success': true,
          //   'message': 'User registered successfully.'
          // })
        }
      });

    });

  });
}

module.exports = scrapeNow;