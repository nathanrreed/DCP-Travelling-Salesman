#!/usr/bin/env node

const SCHEDULER_URL = new URL('https://scheduler-v3.distributed.computer/');
var smallest = {num: Number.MAX_VALUE, string: ""};
function calcDistance(posA, posB){
	return (Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y));
}

function getDistance(distances, posA, posB){
	return distances[toNum(posA)][toNum(posB)];
}

function toNum(character){
	return character.charCodeAt(0) - 'A'.charCodeAt(0);
}

function randomize(size){
	let i, array = [];
	for(i = 0; i < size; i++){
		array[i] = {x: Math.floor(Math.random() * 100) - 49, y: Math.floor(Math.random() * 100) - 49};
	}
	return array;
}

function createDistances(array, size){
	let distances = [ [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [] ];
	let x, y;
	for(x = 0; x < size; x++){
		for(y = 0; y < size; y++){
			distances[x][y] = calcDistance(array[x], array[y]);
		}
	}
	return distances;
}

function calcLength(distances, string){
	let sum = 0, i;
	for(i = 0; i < string.length - 1; i++){
		sum += getDistance(distances, string.charAt(i), string.charAt(i + 1));
	}
	return sum;
}

function swap(string, pos1, pos2){
	string = string.replace(pos1, '*');
	string = string.replace(pos2, pos1);
	string = string.replace('*', pos2);
	return string;
}

function createString(size){
	let i, string = "A";
	for(i = 0; i < size; i++){
		string += String.fromCharCode(i + 'B'.charCodeAt(0));
	}
	string += 'A';
	return string;
}

function findSmallest(distances, string, start){
	createPerms(string, start, string.length - 1, distances);
}

function createPerms(string, start, end, distances){
	if(start === end){
		let temp = calcLength(distances, string);
		//console.log(string + " : " + temp);
		if(calcLength(distances, string) < smallest.num){
			smallest = {num: temp, string: string};
		}
		
	}else{
		let i;
		for(i = start; i < end; i++){
			string = swap(string, string.charAt(start), string.charAt(i));
			createPerms(string, start + 1, end, distances);
			string = swap(string, string.charAt(start), string.charAt(i));
		}
	}
}


function createStarts(string, numCities){
	let starts = [], x = 0, y;
	for(x = 0; x < numCities; x++){
		let curr = String.fromCharCode(x + 'B'.charCodeAt(0));
		string = swap(string, curr.charAt(0), string.charAt(1));
		for(y = 0; y < numCities; y++){
			let next = String.fromCharCode(y + 'B'.charCodeAt(0));
			if(next !== curr){
				string = swap(string, next.charAt(0), string.charAt(2));
				//console.log(string.substring(1,3));
				starts.push(string);
			}
		}
	}
	return starts;
}

function createArray(input){
	input = input.trim().replaceAll("\n", " ");
	let splitIn = input.split(" ");
	
	if(splitIn.length % 2 === 1){
		alert("Improper x y pairs");
		return null;
	}

	let i, array = [];
	for(i = 0; i < splitIn.length / 2; i++){
		array[i] = {x: Number(splitIn[i * 2]), y: Number(splitIn[i * 2 + 1])};
	}
	
	return array;
}

async function main() {
	const compute = require('dcp/compute');
	const wallet = require('dcp/wallet');
	
	function dcp(start){
		debugger;
		progress(0);
		var smallest = {num: Number.MAX_VALUE, string: ""};
		let distances = JSON.parse('TO_REPLACE');
		
		findSmallest(distances, start, 3);
		
		function findSmallest(distances, string, start){
			createPerms(string, start, string.length - 1, distances);
		}
		function createPerms(string, start, end, distances){
			if(start === end){
				progress();
				let temp = calcLength(distances, string);
				//console.log(string + " : " + temp);
				if(temp < smallest.num){
					smallest = {num: temp, string: string};
				}
				
			}else{
				let i;
				for(i = start; i < end; i++){
					progress();
					string = swap(string, string.charAt(start), string.charAt(i));
					createPerms(string, start + 1, end, distances);
					string = swap(string, string.charAt(start), string.charAt(i));
				}
			}
		}
		function calcLength(distances, string){
			let sum = 0, i;
			for(i = 0; i < string.length - 1; i++){
				sum += getDistance(distances, string.charAt(i), string.charAt(i + 1));
			}
			return sum;
		}
		
		function getDistance(distances, posA, posB){
			debugger
			return distances[toNum(posA)][toNum(posB)];
		}

		function toNum(character){
			return character.charCodeAt(0) - 'A'.charCodeAt(0);
		}
		
		function swap(string, pos1, pos2){
			string = string.replace(pos1, '*');
			string = string.replace(pos2, pos1);
			string = string.replace('*', pos2);
			return string;
		}

		progress(1);
		debugger;
		return smallest;
	}
	
	let numCities = 12;
	let array = randomize(numCities + 1);
	distances = createDistances(array, numCities + 1);
	let str = createString(numCities);
	let job;
	if(numCities > 10){
		let starts = createStarts(str, numCities);
		let toWorker = dcp.toString().replace('TO_REPLACE', `${JSON.stringify(distances)}`)
		console.log(starts);
		
		job = compute.for(starts, toWorker);
	
		const ks = await wallet.get();
		job.setPaymentAccountKeystore(ks);
	  
	  
		job.on('accepted', () => {
		console.log(` - Job accepted by scheduler, waiting for results`);
		console.log(` - Job has id ${job.id}`);
		startTime = Date.now();
	  });

		job.on('readystatechange', (arg) => {
			console.log(`new ready state: ${arg}`);
		});

		job.on('result', (ev) => {
			console.log(
				` - Received result for slice ${ev.sliceNumber} at ${
					Math.round((Date.now() - startTime) / 100) / 10
				}s`,
			);
			console.log(ev.result);
		});
	  
	  
		//const results = await job.localExec(2);
		const results = await job.exec(compute.marketValue);
		
		let output = Array.from(results);
		output.forEach(output => {
			if(output.num < smallest.num){
				smallest = output;
			}
		});
		
		console.log("The smallest path is " + smallest.string + " with a length of " + smallest.num + "units.");
	
	}else{
		findSmallest(distances, str, 1);
	}
	
	smallest = {num: Number.MAX_VALUE, string: ""};
	let time = Date.now();
	findSmallest(distances, str, 1);
	console.log(`Time to complete ${Math.round((Date.now() - time) / 100) / 10}s`);
	console.log("The smallest path is " + smallest.string + " with a length of " + smallest.num + "units.");
}

/* Initialize DCP Client and run main() */
require('dcp-client')
	.init(SCHEDULER_URL)
	.then(main)
	.catch(console.error)
	.finally(process.exit);