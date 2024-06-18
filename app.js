let fs = require("fs");
let csv = require("csv-parser");
const axios = require("axios");
const { Parser } = require("json2csv");
require("dotenv").config();

const getDifficulty = async (url) => {
  const title = url.split(process.env.URI)[1].split("/")[0];
  try {
    const data = await axios.post(process.env.URI1, {
      query:
        process.env.QUERY1,
      variables: {
        titleSlug: title,
      },
      operationName: process.env.OPERATION_NAME,
    });
    return data.data.data.question.difficulty;
  } catch (error) {
    return "Not Found";
  }
};

const writeToFile = (data, outputFile) => {
  try {
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(data);
    fs.writeFileSync(outputFile, csv);
  } catch (err) {
    console.log("ERROR: ", err.message);
  }
};

const readFile = async (folder, file) => {
  const inputFile = folder + file;
  let url_array = [];
  let problem_name = [];
  let occurence = [];
  let difficulty = [];
  try {
    const stream = fs.createReadStream(inputFile).pipe(csv());
    stream.on("data", function (data) {
      url_array = [...url_array, data.problem_link];
      problem_name = [...problem_name, data.problem_name];
      occurence = [...occurence, data.num_occur];
    });

    stream.on("end", async function () {
      difficulty = await Promise.all(
        url_array.map(async (url) => getDifficulty(url))
      );

      const result = url_array.map((url, index) => ({
        problem_link: url,
        problem_name: problem_name[index],
        num_occur: occurence[index],
        difficulty: difficulty[index],
      }));

      writeToFile(result, './output/' + file);
    });
  } catch (err) {
    console.log("ERROR: ", err.message);
  }
};

if(!fs.existsSync("./input")){
  console.log("Please create input folder in the root directory.");
  return;
}

if(!fs.existsSync("./output")){
  fs.mkdirSync("./output");
}

fs.readdirSync("./input/").forEach(async (file) => {
  await readFile("./input/", file);
});