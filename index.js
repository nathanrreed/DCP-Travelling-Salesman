var smallest = {num: Number.MAX_VALUE, string: ""};
function tsp(){
	let startTime;
	let numCities = Number(document.getElementById("quantity").value);
	let input = document.getElementById("input").value;
	//let numCities = 10;
	let array;
	if(document.getElementById("rnd").checked === true){
		array = randomize(numCities + 1);
	}else if(input.length > 0){
		array = createArray(input);
		if(array !== null){
			numCities = array.length - 1;
		}
	}
	
	if(array !== null){
		let str = createString(numCities);
		if(numCities >= 6){
			let starts = createStarts(str, numCities);
			$.ajax({
				type: 'get',            //Request type
				dataType: 'json',       //Data type - we will use JSON for almost everything 
				url: '/dcp',   //The server endpoint we are connecting to
				async: false,
				data: {
					array: array,
					numCities: numCities,
				},
				success: function (data) {
					console.log(data.array);
					smallest = data.array;
				},
				fail: function(error) {
					// Non-200 return, do something with error
					console.log(error); 
				}
			});
		}else{
			distances = createDistances(array, numCities + 1);
			findSmallest(distances, str, 1);
		}
		
		
		document.getElementById('output').innerHTML = "The smallest path is " + smallest.string + " with a length of " + smallest.num + " units.";
		console.log("The smallest path is " + smallest.string + " with a length of " + smallest.num + " units.");
		createGraph(array, smallest.string);
	}	
}

function randomize(size){
	let i, array = [];
	for(i = 0; i < size; i++){
		array[i] = {x: Math.floor(Math.random() * 100) - 49, y: Math.floor(Math.random() * 100) - 49};
	}
	return array;
}

function createGraph(array, string){
	let holder = document.getElementById("canHolder");
	holder.removeChild(holder.lastChild);
	let newCan = document.createElement("canvas");
	newCan.id = "canvas";
	newCan.width = 500;
	newCan.height = 500;
	holder.appendChild(newCan);
	
	console.log(array);
	console.log(string);
	
	let ctx = newCan.getContext("2d");
	ctx.restore();
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.stroke();
	ctx.translate(250, 250);
	ctx.scale(4.5, 4.5);
	ctx.lineJoin = "round";
	let i, curr;
	ctx.font = "10px Consolas ";
	ctx.moveTo(array[0].x, array[0].y);
	ctx.arc(array[0].x, array[0].y, .7, 0, 2 * Math.PI);
	
	ctx.fillStyle = "red";
	ctx.fillText('A', array[0].x, array[0].y);
	for(i = 1; i < array.length; i++){
		ctx.fillStyle = "black";
		curr = toNum(string.charAt(i));
		ctx.lineTo(array[curr].x, array[curr].y);
		ctx.arc(array[curr].x, array[curr].y, .7, 0, 2 * Math.PI);
		ctx.fillStyle = "red";
		ctx.fillText(String.fromCharCode(curr + 'A'.charCodeAt(0)), array[curr].x, array[curr].y);
	}
	ctx.lineTo(array[0].x, array[0].y);
	
	
	ctx.stroke();
}

function calcDistance(posA, posB){
	return (Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y));
}

function getDistance(distances, posA, posB){
	return distances[toNum(posA)][toNum(posB)];
}

function toNum(character){
	return character.charCodeAt(0) - 'A'.charCodeAt(0);
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