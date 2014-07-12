$(function(){
	var latest_version = "4.1.1.14";
	var preferred_version = "4.1.0g";
	$.each(version_dictionary, function(key,version){
		$("#version").append("<option value="+key+">"+key+"</option>");
	});
	var reverseTranslate = (function() {
		// Create reverse-lookup translation table.
		var aspects = {};
		for (var aspect in translate) {
			aspects[translate[aspect]] = aspect;
		}
		return aspects;
	})();
	var completionList = (function() {
		var aspects = [];
		for (var aspect in reverseTranslate) {
			aspects.push({ label: aspect + " [" + reverseTranslate[aspect] + "]", value: aspect });
		}
		return aspects;
	})();
	var aspects = [];
	var addon_aspects;
	var combinations = {};
	$("#version").val(preferred_version);
	var version=preferred_version;
	graph = {};

	var isValidAspect = function(aspect) {
		return translate[aspect] || reverseTranslate[aspect];
	};

	var validateAspectRow = function(row) {
		var aspect = $(row).find("input.aspect").val();
		var path = $(row).find("input.path").val();
		var validAspect = isValidAspect(aspect);
		var number = path != "" && !Number.isNaN(path);
		var last = isLastAspectRow(row);
		var empty = isEmptyAspectRow(row);
		var result = (validAspect && (typeof path === undefined || number)) || (last && empty);
		if (result) {
			row.removeClass("error");
		} else {
			row.addClass("error");
		}
		return result;
	};

	var isLastAspectRow = function(row) {
		return row.next("tr.aspect.path").length == 0;
	};

	var isEmptyAspectRow = function(row) {
		var result = row.find("input.aspect").filter(function() {
				return $(this).val() != "";
			}).length == 0;

		if (result) {
			$(row).addClass("empty");
		} else {
			$(row).removeClass("empty");
		}
		return result;
	};

	var rowTemplate = $("tr.aspect.path").first().clone();
	var autocompleteParams = {
		source: completionList,
		autoFocus: true,
		delay: 0
	};

	$("#aspectselection").on("keypress blur", "tr.aspect.first input", null, function(event) {
		if (!isValidAspect($(this).val())) {
			$(this).closest("tr").addClass("error");
		} else {
			$(this).closest("tr").removeClass("error");
		}
		run();
	});

	var validateRows = function(event) {
		run();
	};

	var changeRows = function(event) {
		var row = $(event.target).closest("tr");
		if (validateAspectRow(row)) {
			if (!isEmptyAspectRow(row) && isLastAspectRow(row)) {
				rowTemplate
					.clone()
					.insertAfter(row)
					.find("input.aspect")
					.autocomplete(autocompleteParams);
			} 
		}

		var extraRows = $("#aspectselection")
			.find("tr.aspect.path")
			.filter(function() {
				var empty = isEmptyAspectRow($(this));
				var last = isLastAspectRow($(this));
				var prevEmpty = $(this).prev("tr").is(function() {
						return isEmptyAspectRow($(this)) && $(this).hasClass("path");
					});
				return empty && last && prevEmpty;
			});

		extraRows.remove();
 	};
	
	
	$("#aspectselection").on("keyup", "tr.aspect.path input", null, validateRows);
	$("#aspectselection").on("keydown", "tr.aspect.path input", null, function(event) {
		if (event.which == 27) { // Esc key clears all inputs
			clearAll();
		} else {
			changeRows(event);
		}
	} );

	$("#aspectselection input.aspect").autocomplete(autocompleteParams);

	function connect(aspect1, aspect2) {
		function addConnection(from, to) {
			if (!(from in graph)) graph[from] = [];
			graph[from].push(to);
		}
		addConnection(aspect1, aspect2);
		addConnection(aspect2, aspect1);
	}
	function aspectSort(a, b) {
		return (a == b) ? 0 : (translate[a]<translate[b]) ? -1 : 1;
	}
	function ddDataSort(a, b) {
		return (a.text == b.text) ? 0 : (a.text<b.text) ? -1 : 1;
	}
	function solve(from, to, steps) {
		if (!from || !to || !steps) throw "Invalid parameters."

		function search(queue, to, visited) {
			while (!queue.isEmpty()) {
				var element = queue.dequeue();
				var node = element.path.pop();
				if (!(node in visited) || visited[node].indexOf(element.path.length) < 0) {
					element.path.push(node);
					if (node == to && element.path.length > steps + 1) return element.path;
					graph[node].forEach(function(entry) {
						var newpath = element.path.slice();
						newpath.push(entry);
						queue.enqueue({"path":newpath,"length":element.length+getWeight(entry)});
					});
					if (!(node in visited)) visited[node] = [];
					visited[node].push(element.path.length-1);
				}
			}
			return null;
		}

		var queue = new buckets.PriorityQueue(function(a,b) {
			return b.length-a.length;
		});
		queue.enqueue({"path":[from],"length":0});
		visited = {};
		return search(queue, to, visited);
	}
	function push_addons(aspects, combinations) {
		addon_aspects = [];
		addon_array = addon_dictionary;
		$.each(addon_dictionary, function(key, addon_info){
			$("#addons").append('<input type="checkbox" class="addon_toggle" id="'+key+'" /> <label for="'+key+'">'+addon_info["name"]+'</label>');
			$.each(addon_info["aspects"], function(number, aspect){
				addon_aspects.push(aspect);
			});
			$.each(addon_info["combinations"], function(combination_name, combination){
				combinations[combination_name]=combination;
			});
		});
		addon_aspects = addon_aspects.sort(aspectSort);
		$.each(addon_aspects, function(number, aspect){
			aspects.push(aspect);
		});
	}
	function toggle(obj) {
		$(obj).find("img").attr("src", function(i,orig){ return (orig.indexOf("color") < 0) ? orig.replace(/mono/, "color") : orig.replace(/color/, "mono"); });
		$(obj).toggleClass("unavail");
	}
	function toggle_addons(aspect_list){
		aspect_list.forEach(function(e){
			var obj = $('#'+e);
			obj.find("img").attr("src", function(i,orig){ return orig.replace(/color/, "mono"); });
			obj.addClass("unavail");
		});
	}
	function option(value, text) {
		var option = document.createElement("option");
		option.value = value;
		option.textContent = text;
		return option;
	}

	var clearAll = function() {
		$("#aspectselection tr.aspect.path") 
			.remove();
		$("input.aspect, input.path").val("");
		rowTemplate
			.clone()
			.insertAfter($("#aspectselection tr.aspect.first"))
			.find("input.aspect")
			.autocomplete(autocompleteParams);

		$("#results").empty();
		$("#aspectselection tr.aspect.first input").focus();
	};

	check = document.getElementById("available");
	steps = $("#spinner").spinner({
		min: 1,
		max: 10
	});
	reset_aspects();
	$("#find_connection").click(function(){
		run();
	});
	$('#addons').on("change", ".addon_toggle", function() {
		addon = $(this).attr("id");
		if (this.checked) {
			addon_dictionary[addon]["aspects"].forEach(function(e){
				var obj = $('#'+e);
				obj.find("img").attr("src", function(i,orig){ return orig.replace(/mono/, "color"); });
				obj.removeClass("unavail");
			});
		} else {
			addon_dictionary[addon]["aspects"].forEach(function(e){
				var obj = $('#'+e);
				obj.find("img").attr("src", function(i,orig){ return orig.replace(/color/, "mono"); });
				obj.addClass("unavail");
			});
		}
	});
	$("#sel_all").click(function(){
		$(".aspect").each(function(){
			$(this).find("img").attr("src", function(i,orig){ return orig.replace("mono", "color")});
			$(this).removeClass("unavail");
		});
		$(".addon_toggle").prop('checked', true);
	});
	$("#desel_all").click(function(){
		$(".aspect").each(function(){
			$(this).find("img").attr("src", function(i,orig){ return orig.replace("color", "mono")});
			$(this).addClass("unavail");
		});
		$(".addon_toggle").prop('checked', false);
	});
	$("#version").change(function(){
		version = $("#version").val();
		$("#results").empty();
		clearAll();
		reset_aspects();
	});
	$(".aspectlist").on( "click", ".aspect", function(){
		toggle(this);
		run();
	});
	$(".aspectlist").on("mouseenter", ".aspect", function() {
		var aspect = $(this).attr("id");
		if (aspect!="fire"&&aspect!="water"&&aspect!="order"&&aspect!="air"&&aspect!="entropy"&&aspect!="earth"){
			var combination = combinations[aspect];
			$("#combination_box #left").html('<img src="aspects/color/' + translate[combination[0]] + '.png" /><div class="name">' + translate[combination[0]] + '</div><div class="desc">' + combination[0] + '</div>');
			$("#combination_box #right").html('<img src="aspects/color/' + translate[combination[1]] + '.png" /><div class="name">' + translate[combination[1]] + '</div><div class="desc">' + combination[1] + '</div>');
			$("#combination_box #equals").html('<img src="aspects/color/' + translate[aspect] + '.png" /><div class="name">' + translate[aspect] + '</div><div class="desc">' + aspect + '</div>');
			$(this).mousemove(function(e) {
				$("#combination_box").css({left:e.pageX+10, top:e.pageY-100}).show();
			});
		} else {
			$("#combination_box").hide();
		}
	});
	$(".aspectlist").on("mouseleave", ".aspect", function() {
		$("#combination_box").hide();
	});
	$("#clear_all").click(clearAll);
	
	function reset_aspects() {
		aspects = $.extend([], version_dictionary[version]["base_aspects"]);
		combinations = $.extend(true, {}, version_dictionary[version]["combinations"]);
		$("#avail, #addons").empty();
		$('#fromSel').ddslick("destroy");
		$('#toSel').ddslick("destroy");
		$(".addon_toggle").prop('checked', false);
		tier_aspects = [];
		$.each(combinations, function(aspect, value){
			tier_aspects.push(aspect);
		});
		tier_aspects = tier_aspects.sort(aspectSort);
		aspects = aspects.concat(tier_aspects);
		push_addons(aspects, combinations);
		aspects.forEach(function(aspect) {
			$('#avail').append('<li class="aspect" id="'+aspect+'"><img src="aspects/color/' + translate[aspect] + '.png" /><div>' + translate[aspect] + '</div><div class="desc">' + aspect + '</div></li>');
		});
		toggle_addons(addon_aspects);
		var ddData = [];
		aspects.forEach(function(aspect) {
			ddData.push({text: translate[aspect], value: aspect, description: "(" + aspect + ")", imageSrc: "aspects/color/" + translate[aspect] + ".png"});
		});
		ddData.sort(ddDataSort);
		$('#fromSel').ddslick({
			data: ddData,
			defaultSelectedIndex: 0,
			height: 300,
			width: 170
		});
		$('#toSel').ddslick({
			data: ddData,
			defaultSelectedIndex: 0,
			height: 300,
			width: 170
		});
		graph={};
		for (compound in combinations) {
			connect(compound, combinations[compound][0]);
			connect(compound, combinations[compound][1]);
		}
		run();
	}
	function run() {
		var aspectRows = $("#aspectselection").find("tr.aspect");
		if (aspectRows.not(function() { return isEmptyAspectRow($(this)); }).length < 2 
			|| aspectRows.not(function() { return validateAspectRow($(this)); }).length > 0)
		{
			$("#results").empty();
			return;
		}

		var waypoints = [];
		$("#aspectselection input.aspect").not(function() { return !$(this).val(); }).each(function() {
			waypoints.push({ aspect: $(this).val(), steps: Number($(this).closest("tr").find("input.path").val()) });
		});

		$("#results").empty();

		var step_count=0;
		var aspect_count={};

		$.each(aspects, function(aspect, value){
			aspect_count[value]=0;
		});
			
		for (var waypointIndex = 0; waypointIndex+1 < waypoints.length; ++waypointIndex) {
			var fromSel = reverseTranslate[waypoints[waypointIndex].aspect];
			var toSel = reverseTranslate[waypoints[waypointIndex+1].aspect];
			var path = solve(fromSel, toSel, waypoints[waypointIndex+1].steps);

			var loop_count=0;
			path.forEach(function(e) {
				if (++loop_count != 1 || waypointIndex == 0) {
					if(loop_count != 1 && loop_count != path.length) {
						++aspect_count[e];
						++step_count;
					}
					var node = $('<li class="aspect_result"><img src="aspects/color/' + translate[e] + '.png" /><div>' + translate[e] + '</div><div class="desc">' + e + '</div></li><li>↓</li>');
					if (loop_count == 1 || loop_count == path.length) {
						node.first().addClass("waypoint");
					}
					node.first().data({ aspect: e });
					node.first().click(function(event) {
							toggle($("#" + $(this).data().aspect));
							run();
						});
					node.appendTo($("#results"));
				}
			});
		}
		$("#results").children().last().remove();
		$("#results").append('<li id="aspects_used">Aspects Used</li>');
		var used = '<ul id="aspects_used_list">';
		$.each(aspect_count, function(aspect, value){
			if(value>0) {
				used = $(used).append('<li title="'+translate[aspect]+': '+value+'" style="background-image:url(\'aspects/color/'+translate[aspect]+'.png\')">'+value+'</li>');
			}
		});
		used = $(used).append("<div>Total Steps: "+ step_count+"</div>");
		used = $(used).append('</ul>');
		$("#results").append(used);
	}
	function getWeight(aspect) {
		var el = $("#" + aspect);
		return (el.hasClass("unavail")) ? 100 : 1;
	}

	$(document).ready(function() {
		$("#aspectselection tr.first input.aspect").focus();
	});
});
