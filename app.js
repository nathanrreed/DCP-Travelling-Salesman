#!/usr/bin/env node

//Connect to website
const express = require('express')
const app = express()
const port = 3000
const path = require("path");
const fs = require('fs');
const dcp1 = require('dcp-client');
let array, numCities;
let ready = false;
var smallest = {num: Number.MAX_VALUE, string: ""};

app.get('/dcp', function(req , res){
	array = req.query.array;
	numCities = Number(req.query.numCities);
	startJob().then((smallest) => {
		console.log("SENT");
		res.send({
			array: smallest
	    });
	})
});

app.get('/getReturn', function(req , res){
	if(ready === true){
		ready = false;
	}
	res.send({
		smallest: smallest,
	});
});

app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'));
});

app.get('/index.js',function(req,res){
  res.sendFile(path.join(__dirname+'/index.js'));
});

const SCHEDULER_URL = new URL('https://scheduler-v3.distributed.computer/');

async function startJob(){
	await dcp1.init(SCHEDULER_URL).then(main);
	return smallest;
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

function calcDistance(posA, posB){
	return (Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y));
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

async function main() {
	const compute = require('dcp/compute');
	const wallet = require('dcp/wallet');
	
	function dcp(start){
		progress(0);
		var smallest = {num: Number.MAX_VALUE, string: ""};
		let distances = JSON.parse('TO_REPLACE');
		debugger;
		findSmallest(distances, start, 3);
		
		function findSmallest(distances, string, start){
			createPerms(string, start, string.length - 1, distances);
		}
		function createPerms(string, start, end, distances){
			if(start === end){
				progress();
				let temp = calcLength(distances, string);
				console.log(string + " : " + temp);
				debugger;
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
			debugger;
			return distances[toNum(posA)][toNum(posB)];
		}

		function toNum(character){
			return Number(character.charCodeAt(0) - 'A'.charCodeAt(0));
		}
		
		function swap(string, pos1, pos2){
			string = string.replace(pos1, '*');
			string = string.replace(pos2, pos1);
			string = string.replace('*', pos2);
			return string;
		}

		progress(1);
		return smallest;
	}

	array.forEach(point => {
		point.x = Number(point.x);
		point.y = Number(point.y);
	});
	
	distances = createDistances(array, numCities + 1);
	let str = createString(numCities);
	let job;
	let starts = createStarts(str, numCities);
	let toWorker = dcp.toString().replace('TO_REPLACE', `${JSON.stringify(distances)}`)
	
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
  
	debugger
	//const results = await job.localExec(1);
	const results = await job.exec(compute.marketValue);
	
	let output = Array.from(results);
	output.forEach(output => {
		if(output.num < smallest.num){
			smallest = output;
		}
	});
	
	ready = true;
	console.log("The smallest path is " + smallest.string + " with a length of " + smallest.num + " units.");
	return smallest;
}

function createString(size){
	let i, string = "A";
	for(i = 0; i < size; i++){
		string += String.fromCharCode(i + 'B'.charCodeAt(0));
	}
	string += 'A';
	return string;
}

app.listen(port);