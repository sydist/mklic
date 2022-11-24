#!/usr/bin/env node

// Set up cli with commander.
import { program } from "commander";

program
    .name("mklic")
    .version("v2.0.0")
    .description("CLI tool for generating LICENSE files");

program
    .option("-q, --query <search>", "name, id, or keywords for license search")
    .option("-p, --path <path>", "relative path for your license file", "./LICENSE")
    .option("-d, --deprecated", "show deprecated licenses", false)
    .option("-o, --non-osi", "show non-osi-approved licenses", false)
    .option("-r, --remove-cache", "deletes cached licenses", false)
    .parse()


// Variables.
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { existsSync, rmSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CACHE_PATH = resolve(__dirname, "cache.json");
const OPTIONS = program.opts();
const OUTPUT_PATH = OPTIONS.path;
const FIELDS_EXPRESSION = new RegExp(/\[.+?]|<[^://]+?>/g);
let licenses = [];
let CACHE_EXISTS = existsSync(CACHE_PATH);

// Remove cache
if (OPTIONS.removeCache)
{
    if (CACHE_EXISTS)
    {
        rmSync(CACHE_PATH);
        CACHE_EXISTS = false;
        console.log("Cache removed.");
    } else console.log("No cache found.");
}


// Load licenses from cache if they exist, otherwise download them.
import ora from "ora";
import axios from "axios";
import { readFileSync, writeFileSync } from "fs";

if (CACHE_EXISTS) licenses = JSON.parse( readFileSync(CACHE_PATH) );
else 
{
    // Loading ...
    const spinner = ora({ color: "cyan" }).start("LOADING LICENSES ...");


    // Request a list of all SPDX licenses.
    licenses = await axios.get("https://spdx.org/licenses/licenses.json")
        .then(response => response.data.licenses)
        .catch(e =>
        {
            console.error("\nRequest failed, please try again with a more stable connection.");
            process.exit(1);
        });


    // Get each license's text, and simplify object.
    let texts = [];
    licenses.forEach( async license => 
    {
        const request = axios.get(license.detailsUrl);
        texts.push(request);
    });

    texts = await Promise.all(texts)
        .then(texts => texts.map(res => res.data.licenseText))
        .catch(e =>
        {
            console.error("\nRequests failed, please try again with a more stable connection.");
            process.exit(1);
        });

    licenses = licenses.map((license, index) =>
    {
        return {
            id: license.licenseId,
            url: license.detailsUrl,
            name: license.name,
            deprecated: license.isDeprecatedLicenseId,
            osiApproved: license.isOsiApproved,
            text: texts[index],
        };
    });

    
    // Cache sorted licenses to disk.
    licenses = licenses.sort((a, b) => a.name.localeCompare(b.name));
    writeFileSync(CACHE_PATH, JSON.stringify(licenses));
    spinner.stop();
}


// Filter licenses depending on provided arguments.
if (OPTIONS.query)
    licenses = licenses.filter(license => license.name.toLowerCase().match(OPTIONS.query.toLowerCase()) || license.id.toLowerCase().match(OPTIONS.query.toLowerCase()));

if (!OPTIONS.deprecated)
    licenses = licenses.filter(license => !license.deprecated);

if (!OPTIONS.nonOsi)
    licenses = licenses.filter(license => license.osiApproved);

// Prompt user to pick a license.
import inquirer from "inquirer";

const { name } = await inquirer
    .prompt({ 
        type: "list", 
        choices: licenses.map(license => license.name), 
        name: "name", 
        loop: false, 
        message: "Pick a license:",
        pageSize: 10,
    });

let text = licenses.find(license => license.name === name).text;


// Selects all [] and <> fields.
let fields = text.match(FIELDS_EXPRESSION) ?? 0;
if (fields.length > 0)
{
    // Remove duplicates.
    fields = Array.from(new Set(fields));
    console.log("\nPlease fill in the following:");

    // Prompt user for license info.
    for (const field of fields)
    {
        const { value } = await inquirer
            .prompt(
            {
                message: `${field}: `,
                type: "text",
                name: "value",
            });

        text = text.replaceAll(field, value);
    }    
}

// Wrap text and create the file.
import wrap from "word-wrap";

text = wrap(text, { width: 78, indent: "" });
writeFileSync(OUTPUT_PATH, text);

console.log(`License file created successfuly at ${OUTPUT_PATH}`);
