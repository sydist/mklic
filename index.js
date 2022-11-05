#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { load } from "js-yaml";
import yargs from "yargs/yargs";
import prompts from "prompts";
import { resolve, dirname } from "path"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename);

// Set up command-line arguments
const args = yargs(process.argv.slice(2))
	.scriptName("mklic")
	.version("1.0.0")
	.usage("\nUSAGE: $0 [<license>] [<path>]")
	.option("name", { alias: "n", describe: "Name of the license to use", default: "", string: true })
	.option("output", { alias: "o", describe: "Path to the LICENSE file", default: "./LICENSE", string: true })
	.alias("h", "help")
	.alias("v", "version")
	.strict()
	.argv

// Filter licenses
let licenses = [];
const FOLDER = resolve(__dirname, "./yaml-licenses/src/");
const FILES = readdirSync(FOLDER, "utf-8");
FILES.forEach(FILE =>
{
	const yaml = readFileSync(`${FOLDER}/${FILE}`, "utf-8");
	const object = load(yaml);

	// Don't add to the licenses list if it does not match the passed name.
	const expression = new RegExp(args.name, "gi");
	const condition = object["title"].match(expression) || object["spdx-id"].match(expression);
	if (!condition)
		return;

	licenses.push(object);
});


// Exit safely with a message when no licenses are found
if (licenses.length === 0)
{
	console.error("No license was found.");
	process.exit(1);
}


// Show selection when there is more than one matching license
let selected = 0;
if (licenses.length > 1)
{
	licenses.sort((a, b) =>
	{
		const x = a.title.toLowerCase();
		const y = b.title.toLowerCase();

		if (x > y) return 1;
		if (x < y) return -1;
		return 0;
	});

	const response = await prompts({
		message: "Select a license:",
		type: "select",
		choices: licenses.map(({ title }) => title),
		name: "value",
	});

	if (Object.entries(response).length === 0)
		process.exit(1);

	selected = response.value
}


// Get the license's text and remove the first line: it's only there for YAML formatting.
let text = licenses[selected].text.split("\n").splice(1).join("\n");


// Finds inputs in the license
const expression = new RegExp(/\[(.*?)\]|<([^:\/\/]*?)>/g);
let replacables = text.match(expression);
if (replacables.length > 0)
{
	// Remove duplicates
	replacables = Array.from(new Set(replacables));

	console.log("\nPlease fill in the following:");
	for (const replacable of replacables)
	{
		const { value } = await prompts(
		{
			message: `${replacable}: `,
			type: "text",
			name: "value",
			validate: val => val.match(/\S/g)
		});

		text = text.replace(replacable, value)
	}
}

writeFileSync(args.output, text);

console.log("\nLicense created successfully!")
