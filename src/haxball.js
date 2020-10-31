		var room = HBInit();
		
		room.setDefaultStadium("Big");
		room.setScoreLimit(3);
		room.setTimeLimit(4);
		room.setTeamsLock(true)

		// If there are no admins left in the room give admin to one of the remaining players.
		function updateAdmins() { 
		  // Get all players
		  var players = room.getPlayerList();
		  console.log(players);
		  if ( players.length == 1 ) return; // No players left, do nothing.
		  if ( players.find((player) => player.admin && player.id != 0) != null ) return; // There's an admin left so do nothing.
		  room.setPlayerAdmin(players.find((player) => player.id != 0).id, true); // Give admin to the first non admin player in the list
		}


		function initPlayerStats(player){
			if(player != null){
				if (stats.get(player.name)) return;
				stats.set(player.name, [0, 0, 0, 0, 0, 0])
		    } // goals, assists, wins, loses, og, cs
		}


		function statsFun(player, message){ // !stats Anddy
			if (stats.get(player.name)){
				sendStats(player.name);
			}

			return false;
		}


		function rankFun() { // !ranking
			string = ranking();
			room.sendAnnouncement("Ranking: " + string);

			return false;
		}

		function resetStatsFun (player){ // !resetstats
			if (rankingCalc(player.name) > 0){
				stats.set(player.name, [0,0,0,0,0,0]);
				room.sendAnnouncement("👮‍♂️: Your stats have been reseted ! ",null,null,"italic",null);
			}
			else (room.sendAnnouncement("👮‍♂️: You must have positive points to be able to reset it, sorry.",null,null,"italic",null))
		}


		/*
		Events
		*/
		var stats = new Map(); // map where will be set all player stats
		var mutedPlayers = []; // Array where will be added muted players
		var init = "init"; // Smth to initialize smth
		init.id = 0; // Faster than getting host's id with the method
		init.name = "init";
		var scorers ; // Map where will be set all scorers in the current game (undefined if reset or end)
		var whoTouchedLast; // var representing the last player who touched the ball
		var whoTouchedBall = [init, init]; // Array where will be set the 2 last players who touched the ball
		var gk = [init, init];
		var goalScored = false;
		const time_to_clear_bans = 1000*60*60;
		const time_to_clear_kicks = 1000*60;
		const time_to_clear_flood = 3000;
		const time_to_clear_abuser = 1000*60*60;
		const password = "slb69"
		var kickedNumber = 0;
		var maxKicksForMinute = 5;
		const afkPlayerIDs = new Set();
		var lastMassage = "";
		var trainingEnabled = false;
		var blackListPlayers = []; // Array where will be added black list players
		var isLockedByAdm = false;

		var commands = {
		    // Command that doesnt need to know players attributes.
		    "!help": helpFun,
		    "!gkhelp": gkHelpFun,
		    "!admhelp": adminHelpFun,
		    "!rankhelp": rankHelpFun,
		    "!ranking": rankFun,
		    "p": putPauseFun,
		    "!p": unPauseFun,
		    "!poss": teamPossFun,

		    // Command that need to know who is the player.
		    "!resetstats": resetStatsFun,
		    "!gk": gkFun,
		    "!hayley": adminFun,
		    "!afk" : afksFun,
		    "!kickafs" : kickafksFun,
		    "!ban4ever" : ban4everFun,

		    // Command that need to know if a player is admin.
		    "!swap": swapFun,
		    "!rr": resetFun,
		    "!clear": clearbansFun,
		    "!lock" : setpasswordFun,
		    "!unlock" : clearpasswordFun,
		    "!training" : trainingFun,

		    // Command that need to know what's the message.
		    "!status": statsFun,

		    // Command that need to know who is the player and what's the message.
		    "!mute" : pushMuteFun,
		    "!unmute": unmuteFun,
		    "!unmuteall" : unmuteAllFun,


		    //Command to help against bad admins
		    "!admafk" : admAfkFun,
		    "!abuser" : abuserFun,
		    "!resign" : resignFun,
		    "!here" : admHereFun,

		    //Command change maps
		    "!maps" : mapsFun,
		    "!futx4" : futx4Fun,
		    "!penalBlue" : penalBlueFun,
		    "!penalRed" : penalRedFun,
		    "!trainingMap" : trainingMapFun,
		    "!amist" : setAmistoso
		}


		function swapFun(player){
			if (player.admin == true){
				if (room.getScores() == null) {
					players = room.getPlayerList();
					for (i = 0; i < players.length; i++){
						if (players[i].team == 1){
							room.setPlayerTeam(players[i].id, 2);
						}
						else if (players[i].team == 2){
							room.setPlayerTeam(players[i].id, 1);
						}
					}
				}
			}
		}


		 function putPauseFun() { // p
		 	room.pauseGame(true);
		 	return false;
		 }
		 
		function unPauseFun() { // !p
			room.pauseGame(false);
			return false;
		}


		function pushMuteFun(player, message){ // !mute Anddy
		    // Prevent somebody to talk in the room (uses the nickname, not the id)
		    // need to be admin
		    if (player.admin == true){
		    	if (!(mutedPlayers.includes(message.substr(6)))) mutedPlayers.push(message.substr(6));
		    }
		}

		function unmuteFun(player, message){ // !unmute Anddy
		    // Allow somebody to talk if he has been muted
		    // need to be admin
		    if (player.admin == true){
		    	pos = mutedPlayers.indexOf(message.substr(9));
		    	mutedPlayers.splice(pos, 1);
		    }

		    return false;
		}

		function gotMutedFun(player){
			if (mutedPlayers.includes(player.name)){
				return true;
			}
		}

		function unmuteAllFun(player){
			if (player.admin == true){
				for(i=0; i < mutedPlayers.length; i++){
					pos = mutedPlayers.indexOf(message.substr(9));
					mutedPlayers.splice(pos, 1);
				}
			}
		}

		function gkHelpFun() { // !gkhelp
			room.sendAnnouncement('👮‍♂️: O jogador mais próximo ao gol será marcado como GK ! (Escreva "!gk" se o bot estiver errado).')
		}
		function rankHelpFun() { // !gkhelp
			room.sendAnnouncement("👮‍♂️: Get points by doing good things in this room ! Goal: 5 pts, assist: 3 pts, win: 3 pts, cleansheets: 6 pts, lose: -7 pts, owngoals: -4 pts.")
		}


		 function helpFun() { // !help
		 	room.sendAnnouncement('👮‍♂️: Available commands: "!afk","!abuser", "!admafk", "!status", "!ranking", "!poss",' +
		 		'"!resetstats", "!admhelp", "!gkhelp", "!rankhelp"');
		 }
		 
		 function adminHelpFun() {
		 	room.sendAnnouncement('👮‍♂️: Available commands: "!mute Player", "!unmute Player", "!maps", "!training" , "!resign", "!lock", "!unlock",' +
		 		'"!clear", "!rr", "!swap" (to switch reds and blues). You need to be admin.')
		 }


		function adminFun(player, message){ // !admin Andis
		    // Gives admin to the person who type this password
		    let players = room.getPlayerList();
		    let admin = players.find((player) => player.admin && player.id != 0);
		    room.setPlayerAdmin(admin.id,false);
		    room.setPlayerAdmin(player.id, true);
		    return false; // The message won't be displayed
		}

		function resignFun(player, message){
			let players = room.getPlayerList();
			let admin = players.find((player) => player.admin && player.id != 0);
			
			if(admin.length > 1){
				room.setPlayerAdmin(player.id, false);
				updateAdmins();
			}else{
				room.sendAnnouncement("👮‍♂️: Você deve esperar outra pessoa entrar na sala.",null,null,"bold",null);
			}

			return false;
		}

		function mapsFun(player, message) { // !maps
			room.sendAnnouncement('👮‍♂️: Os mapas disponíveis são: !futx4, !trainingMap, !penalBlue and !penalRed ');
			return false;
		}

		function futx4Fun(player, message){
			if(player.admin == true && room.getScores() == null){
				room.setCustomStadium(futsalX4Stadium);
			}
			return false;
		}

		function penalBlueFun(player, message){
			if(player.admin == true && room.getScores() == null){
				room.setCustomStadium(penalBlue);
			}
			return false;
		}

		function penalRedFun(player, message){
			if(player.admin == true && room.getScores() == null){
				room.setCustomStadium(penalRed);
			}
			return false;
		}

		function trainingMapFun(player, message){
			if(player.admin == true && room.getScores() == null){
				room.setCustomStadium(futsalTraining);
			}
			return false;
		}

		function admAfkFun(player,message){
			if(isCheckinAdm == false){
				var players = room.getPlayerList();
				room.sendAnnouncement("👮‍♂️🚨: Estamos verificando a disponibilidade dos admins.",null,null,"italic",null);
				let admin = players.find((player) => player.admin && player.id != 0);
				console.log(admin);
				room.sendChat("👮‍♂️: O jogador " + player.name + " denunciou você.", admin.id);
				room.sendChat(`👮‍♂️🚨: Digite "!here" para não perder a sua adm!`,admin.id);
				admOnline = false;
				isCheckinAdm = true;

				setInterval(function() {
					if(!admOnline){
						room.kickPlayer(admin.id,"👮‍♂️: Você ficou fora quando a sala precisou de você.",false)
						isCheckinAdm = false;
					}
				},15000)
			}

			return false;
		}

		var isCheckinAdm = false;
		var admOnline = true;

		function admHereFun(){
			var players = room.getPlayerList();
			admOnline = true;
			isCheckinAdm = false;
			let admin = players.find((player) => player.admin && player.id != 0);
			room.sendAnnouncement("👮‍♂️: O Bot verificou que o admin " + admin.name + " está online.",null,null,"bold",null);
			return false;
		}

		function resetFun(player){
			if (player.admin == true){
				room.stopGame();
				room.startGame();
			}

			return false;
		}

		function afksFun(player, message){ // !classic
			if (afkPlayerIDs.has(player.id)){
				afkPlayerIDs.delete(player.id);
				room.sendAnnouncement("👮‍♂️:" + player.name + " está de volta e pronto para jogar!");}
				else {
					afkPlayerIDs.add(player.id); room.setPlayerTeam(player.id, 0);
					room.sendAnnouncement("👮‍♂️: " + player.name + " está indisponível para jogar no momento! 😴😴😴");
				}

				return false;
			}

		function kickafksFun(player, message){ // !huge
			if (player.admin == true){
				afksPlayers = room.getPlayerList().filter((x) => afkPlayerIDs.has(x.id));
				for(var i=0;i<afksPlayers.length;i++){room.kickPlayer(afksPlayers[i].id,"AFK!",false);}
			}

		return false;
	}

		function setpasswordFun(player, message){  //!set_password  !confirm
			if (player.admin == true){
				isLockedByAdm = true;
				code = password;
				room.setPassword(code);
				room.sendAnnouncement("👮‍♂️: Sala fechada.",null,null,"italic",null);
			}

			return false;
		}


		function setAmistoso(player, message){  //!set_password  !confirm
			if (player.admin == true){
				isLockedByAdm = true;
				code = password;
				room.setPassword(code);
				room.sendAnnouncement("👮‍♂️: Sala fechada para amistoso. VAMOS SBL!",null,null,"italic",null);
			}

			return false;
		}

		function clearpasswordFun(player, message){  //!clear_password
			if (player.admin == true){
				isLockedByAdm = false;
				room.setPassword();
				room.sendAnnouncement("👮‍♂️: Sala aberta novamente.",null,null,"italic",null);
			}

			return false;
		}

		function clearbansFun(player,message){
			if(player.admin == true){
				room.clearBans();
				room.sendAnnouncement("👮‍♂️: A lista de bans está vazia novamente.",null,null,"italic",null);
			}

			return false;
		}

		var abuserTimes = 0;

		function abuserFun(player,message){
			abuserTimes++;
			var players = room.getPlayerList();
			let admin = players.find((player) => player.admin && player.id != 0); 
			console.log(admin);
			room.sendChat("👮‍♂️: O jogador " + player.name + " denunciou você.", admin.id);

			if(abuserTimes >= 10){
				room.kickPlayer(admin.id,"👮‍♂️: Você abusou do poder de admin", true);
				abuserTimes = 0;
			}

			return false;
		}

		function gkFun(player){ // !gk

			if (room.getScores() != null && room.getScores().time < 60){
				if (player.team == 1) {
					gk[0] = player;
				}
				else if (player.team == 2){
					gk[1] = player;
				}
			}
			return;
		}


		function lockIfFull(player){
			var players = room.getPlayerList();
			if(players.length == room.maxPlayers - 1 || players.length == room.maxPlayers){
				room.setPassword(password);
			}else{
				if(!isLockedByAdm){
					room.setPassword();
				}
			}
		}

		function checkIfTeamsAreFully(){
			var players = room.getPlayerList();
			var redTeam = players.filter(player => player.team == 1);
			var blueTeam = players.filter(player => player.team == 2);

			if(redTeam.length != blueTeam.length && !trainingEnabled){
				room.pauseGame(true);
				room.sendAnnouncement("👮‍♂️🚨: Os times precisam ter o mesmo número de jogadores.",null,null,"bold",null);
				room.sendAnnouncement(`👮‍♂️🚨: Admin pode ativar o modo treino enquanto isso. Digite "!training" para ativar.`,null,null,"bold",null);

			}
		}

		var badWordsAllowed = true;

		function blockBadWordsFun(player,message){
			if(player.admin == true){
				badWordsAllowed = false;
			}
		}

		function allowBadWordsFun(player,message){
			if(player.admin == true){
				badWordsAllowed = true;
			}
		}

		function trainingFun(player,message){
			if(player.admin == true){
				trainingEnabled = !trainingEnabled;
				if(trainingEnabled == true){
					room.sendAnnouncement("👮‍♂️🚨: O modo treino foi ativado.");
				}else{
					room.sendAnnouncement("👮‍♂️🚨: O modo treino foi desativado.");
				}
			}
			return false;
		}


		function ban4everFun(player,message){
			if(player.admin == true){
				let bannedName = message.substr(10);
				let bannedPlayer = room.getPlayerList().find((player) => player.name == bannedName);
				if(bannedPlayer != undefined || bannedPlayer != null){
					blackListPlayers.push(bannedPlayer.name);
					room.kickPlayer(bannedPlayer.id,"👮‍♂️🚨: Você foi colocado na lista negra da sala. Até que a lista seja revista, você não poderá mais jogar aqui.", true);
				}
			}
			return false;
		}

		function clearBlackList(){
			blackListPlayers = [];
			room.sendAnnouncement("👮‍♂️🚨: Lista foi limpa");
		}

		function clonekick(player){
   			players = room.getPlayerList();
    		for (i = 0; i < players.length-1; i++){
	        if (player.name == players[i].name){
	            room.kickPlayer(player.id,"👮‍♂️🚨: Já existe um jogador com esse nome",false);
      		  }
    		}
		}


		/*
		    For ranking
		    */

		    function rankingCalc(player){
		    	return stats.get(player)[0] * 5 + stats.get(player)[1] * 3 +
		    	stats.get(player)[2] * 3 + stats.get(player)[5] * 6 -
		    	stats.get(player)[3] * 7 - stats.get(player)[4] * 4;
		    }

		    function ranking(){

		    	var overall = [];
		    	players = Array.from(stats.keys());
		    	for (var i = 2; i < players.length; i++) {
		    		score = rankingCalc(players[i])
		        // Goal: 5 pts, assist: 3 pts, win: 3 pts, cs: 6 pts, lose: -7 pts, og: -4 pts
		        overall.push({name: players[i], value: score});
		    }
		    overall.sort(function(a,b){
		    	return b.value - a.value;
		    })
		    string = "";

		    for (var i = 0; i < overall.length; i++) {
		    	if (overall[i].value != 0){
		    		string += i+1 + ") " + overall[i].name + ": " + overall[i].value + " pts, ";
		    	}
		    }
		    return string;
		}


		function sendStats(name){
		    ps = stats.get(name); // stands for playerstats
		    room.sendAnnouncement(name + ": ⚽ Gols: " + ps[0] + ", 🤝 Assists: " + ps[1]
		    	+ ", 😰 Gols Contra: " + ps[4] + ", 💪 CleanSheets: " + ps[5] + ", 🥇 Vitórias: " + ps[2] + ", 🥈 Derrotas: " + ps[3] +
		    	" 🏆 Pontos: " + rankingCalc(name),null,null,"bold",null);
		}

		 function whichTeam(){ // gives the players in the red or blue team
		 	var players = room.getPlayerList();
		 	var redTeam = players.filter(player => player.team == 1);
		 	var blueTeam = players.filter(player => player.team == 2);
		 	return [redTeam, blueTeam]
		 }
		 


		 function isGk(){ // gives the mosts backward players before the first kickOff
		 	var players = room.getPlayerList();
		 	var min = players[0];
		 	min.position = {x: room.getBallPosition().x + 60}
		 	var max = min;

		 	for (var i = 0; i < players.length; i++) {
		 		if (players[i].position != null){
		 			if (min.position.x > players[i].position.x) min = players[i];
		 			if (max.position.x < players[i].position.x) max = players[i];
		 		}
		 	}
		 	return [min, max]
		 }



		/*
		For the game
		*/

		// Gives the last player who touched the ball, works only if the ball has the same
		// size than in classics maps.
		var radiusBall = 10;
		var triggerDistance = radiusBall + 15 + 0.1;
		function getLastTouchTheBall(lastPlayerTouched, time) {
			var ballPosition = room.getBallPosition();
			var players = room.getPlayerList();
			for(var i = 0; i < players.length; i++) {
				if(players[i].position != null) {
					var distanceToBall = pointDistance(players[i].position, ballPosition);
					if(distanceToBall < triggerDistance) {
						lastPlayerTouched = players[i];
						return lastPlayerTouched;
					}
				}
			}
			return lastPlayerTouched;

		}



		// Calculate the distance between 2 points
		function pointDistance(p1, p2) {
			var d1 = p1.x - p2.x;
			var d2 = p1.y - p2.y;
			return Math.sqrt(d1 * d1 + d2 * d2);
		}

		function isOvertime(){
			scores = room.getScores();
			if (scores != null){
				if (scores.timeLimit != 0){
					if (scores.time > scores.timeLimit){
						if (scores.red == 0 && hasFinished == false){
							stats.get(gk[0].name)[5] += 1;
							stats.get(gk[1].name)[5] += 1;
							hasFinished = true;
						}
					}
				}
			}
		}
		// return: the name of the team who took a goal
		var team_name = team => team == 1 ? "blue" : "red";

		// return: whether it's an OG
		var isOwnGoal = (team, player) => team != player.team ? " (Gol Contra)" : "";

		// return: a better display of the second when a goal is scored
		var floor = s => s < 10 ? "0" + s : s;

		// return: whether there's an assist
		var playerTouchedTwice = playerList => playerList[0].team == playerList[1].team ? " (" + playerList[1].name + ")" : "";



		function updateWinLoseStats(winners, losers){
			for (var i = 0; i < winners.length; i++) {
				stats.get(winners[i].name)[2] += 1;
			}
			for (var i = 0; i < losers.length; i++) {
				stats.get(losers[i].name)[3] += 1;
			}
		}

		function initBallCarrying(redTeam, blueTeam){
			var ballCarrying = new Map();
			var playing = redTeam.concat(blueTeam);
			for (var i = 0; i < playing.length; i++) {
		        ballCarrying.set(playing[i].name, [0, playing[i].team]); // secs, team, %
		    }
		    return ballCarrying;
		}


		function updateTeamPoss(value){
			if (value[1] == 1) redPoss += value[0];
			if (value[1] == 2) bluePoss += value[0];
		}

		var bluePoss;
		var redPoss;
		function teamPossFun(){
			if (room.getScores() == null) return false;
			bluePoss = 0;
			redPoss = 0
			ballCarrying.forEach(updateTeamPoss);
			redPoss = Math.round((redPoss / room.getScores().time) * 100);
			bluePoss = Math.round((bluePoss / room.getScores().time) * 100);
			room.sendChat("👮‍♂️: Ball possession:  red " + redPoss + " - " + bluePoss + " blue." );

		}

		initPlayerStats(room.getPlayerList()[0]) // lazy lol, i'll fix it later
		initPlayerStats(init);

		room.onPlayerLeave = function(player) {
			lockIfFull(player);
			checkIfTeamsAreFully();
			updateAdmins();
		}



		room.onPlayerJoin = function(player) {
			console.log(blackListPlayers);
			if(blackListPlayers.includes(player.name)){
				console.log(player);
				room.kickPlayer(player.id,"👮‍♂️: Você está na lista negra da sala.", true);
				return;
			}
			clonekick(player);
			lockIfFull(player);
		    updateAdmins(); // Gives admin to the first player who join the room if there's no one
		    initPlayerStats(player); // Set new player's stat
		    room.sendChat("👮‍♂️: Olá " + player.name + "! Digite !help para ter acesso aos comandos da sala.", player.id);
		}

		var redTeam;
		var blueTeam;
		room.onGameStart = function() {
			[redTeam,blueTeam] = whichTeam();
			ballCarrying = initBallCarrying(redTeam, blueTeam);
		}

		room.onPlayerTeamChange = function(player){
			if (room.getScores() != null){
				if (1 <= player.team <= 2) ballCarrying.set(player.name, [0, player.team]);
			}
			if (player.team !== 0 && afkPlayerIDs.has(player.id)){
				room.setPlayerTeam(player.id, 0);
				room.sendAnnouncement("👮‍♂️: " + player.name + " está indisponível para jogar!",null,null,"bold",null);
			}
			if (player.id <= 0){
				room.setPlayerTeam(player.id, 0)}
			}




			room.onPlayerChat = function(player, message) {
				if(message == lastMassage){
					room.sendChat("👮‍♂️: ===== ⛔ ᴄᴜɪᴅᴀᴅᴏ ᴄᴏᴍ ᴏ ғʟᴏᴏᴅ! ⛔ =====",player.id);
					return false; 
				}
				if (mutedPlayers.includes(player.name)) return false;
				let spacePos = message.search(" ");
				let command = message.substr(0, spacePos !== -1 ? spacePos : message.length);
				if (commands.hasOwnProperty(command) == true) return commands[command](player, message);
				lastMassage = message;
			}




			room.onPlayerBallKick = function (player){
				whoTouchedLast = player;
			}

			var kickOff = false;
			var hasFinished = false;

		room.onGameTick = function() {

			setInterval(isOvertime, 5000, hasFinished);

				if (kickOff == false) { 
		    // simplest comparison to not charge usulessly the tick thing
		    if (room.getScores().time != 0){
		    	checkIfTeamsAreFully();
		    	kickOff = true;
		    	gk = isGk();
		    	room.sendChat("🥅 Red GK: " + gk[0].name + ", 🥅 Blue GK: " + gk[1].name)
		    	if(trainingEnabled){
		    		room.sendAnnouncement(`👮‍♂️: O modo treino está ativado. Para desativar, digite "!training". Você deve ser um admin!`);
		    	}
		    }
		}
		if (goalScored == false){
			whoTouchedLast = getLastTouchTheBall(whoTouchedLast);
		}
		if (whoTouchedLast != undefined) {

			if (ballCarrying.get(whoTouchedLast.name)) {
				ballCarrying.get(whoTouchedLast.name)[0] += 1/60;
			}

			if  ( whoTouchedLast.id != whoTouchedBall[0].id){
				whoTouchedBall[1] = whoTouchedBall[0];
		            whoTouchedBall[0] = whoTouchedLast; // last player who touched the ball
		        }
		    }
		}

		room.onTeamGoal = function(team){ // Write on chat who scored and when.
			if(trainingEnabled == false){
				goalScored = true;
				var scores = room.getScores();
				var time = scores.time;
				var m = Math.trunc(time/60); var s = Math.trunc(time % 60);
			    time = m + ":" + floor(s); // MM:SS format
			    var ownGoal = isOwnGoal(team, whoTouchedBall[0]);
			    var assist = "";
			    if (ownGoal == "") assist = playerTouchedTwice(whoTouchedBall);


			    room.sendChat("🔸 "+ scores.red + " - " + scores.blue + " 🔹 ᚌ ⚽ " + whoTouchedBall[0].name +
			    	assist + ownGoal + " ᚌ ⏰ " +
			    	time);

			    if (ownGoal != "") {
			    	stats.get(whoTouchedBall[0].name)[4] += 1;
			    } else {
			    	stats.get(whoTouchedBall[0].name)[0] += 1;
			    }

			    if (whoTouchedBall[1] != init && assist != "") stats.get(whoTouchedBall[1].name)[1] += 1;


			    if (scorers == undefined) scorers = new Map(); // Initializing dict of scorers
			    scorers.set(scorers.size + 1 +") " + whoTouchedLast.name, [time, assist, ownGoal])
			    whoTouchedBall = [init, init];
			    whoTouchedLast = undefined;
			}else{
				room.sendAnnouncement("👮‍♂️: Modo treino está ativado e gols/assist não contam para o seu status.");
			}
		}

		room.onPositionsReset = function(){
			goalScored = false;
		}

		room.onTeamVictory = function(scores){ // Sum up all scorers since the beginning of the match.
			if(trainingEnabled == false){
				if (scores.blue == 0 && gk[0].position != null && hasFinished == false) stats.get(gk[0].name)[5] += 1;
				if (scores.red == 0 && gk[1].position != null  && hasFinished == false) stats.get(gk[1].name)[5] += 1;
				if (scores.red > scores.blue) {
					updateWinLoseStats(redTeam, blueTeam);
				}
				else{ updateWinLoseStats(blueTeam, redTeam); }

				room.sendChat("🏆🏆🏆 Gols da partida: ")
			    for (var [key, value] of scorers) { // key: name of the player, value: time of the goal
			    	room.sendChat(key + " " + value[1] + value[2] + ": " + value[0]);
			    }
			    teamPossFun();
			}else{
				room.sendAnnouncement("👮‍♂️: Modo treino está ativado e vitorias/derrotas não contam para o seu status.");
			}
		}

		room.onGameStop = function(){
			scorers = undefined;
			whoTouchedBall = [init, init];
			whoTouchedLast = undefined;
			gk = [init, init];
			kickOff = false;
			hasFinished = false;
		}

		room.onGameUnpause = function(player){
			checkIfTeamsAreFully();
		}


		room.onPlayerKicked = function(kickedPlayer,reason,ban,byPlayer){
			kickedNumber++;
			if(kickedNumber >= maxKicksForMinute){
				room.clearBans();
				room.sendAnnouncement("👮‍♂️: A lista de bans foi limpa.");
				room.kickPlayer(byPlayer.id,"👮‍♂️: Você não pode kickar jogadores sem motivo.",true);
				updateAdmins();
			}
		}

		room.onPlayerAdminChange = function(changedPlayer, byPlayer){
			if(byPlayer.id != 0){
				room.setPlayerAdmin(changedPlayer.id,false);
			}
		}

		setInterval(function() {
			console.log('Limpando Bans');
			room.clearBans();
		}, time_to_clear_bans);


		//interval between kicks
		setInterval(function() {
			kickedNumber = 0;
		}, time_to_clear_kicks);


		//interval flood
		setInterval(function() {
			lastMassage = "";
		}, time_to_clear_flood);


		setInterval(function() {
			abuserTimes = 0;
		}, time_to_clear_abuser);

		//*--------------------------- MAPS BELOW ---------------------------*


		var futsalX4Stadium = `{
			"name" : "🌟 𝗙𝗨𝗧𝗦𝗔𝗟 𝘅𝟰 🎩",

			"width" : 760.7,

			"height" : 377.8,

			"spawnDistance" : 274.2,

			"bg" : { "type" : "hockey" },

			"vertexes" : [
			/* 0 */ { "x" : -685.7, "y" : -342.8, "trait" : "art" },
			/* 1 */ { "x" : 685.7, "y" : -342.8, "trait" : "art" },
			/* 2 */ { "x" : -685.7, "y" : 342.8, "trait" : "art" },
			/* 3 */ { "x" : 685.7, "y" : 342.8, "trait" : "art" },
			/* 4 */ { "x" : -685.7, "y" : -87.5, "trait" : "art" },
			/* 5 */ { "x" : 685.7, "y" : -87.5, "trait" : "art" },
			/* 6 */ { "x" : 685.7, "y" : 87.5, "trait" : "art" },
			/* 7 */ { "x" : -685.7, "y" : 87.5, "trait" : "art" },
			/* 8 */ { "x" : -725.7, "y" : -87.5, "trait" : "art" },
			/* 9 */ { "x" : -725.7, "y" : 87.5, "trait" : "art" },
			/* 10 */ { "x" : 725.7, "y" : -87.5, "trait" : "art" },
			/* 11 */ { "x" : 725.7, "y" : 87.5, "trait" : "art" },
			/* 12 */ { "x" : 0, "y" : -342.8, "trait" : "art" },

			/* 13 */ { "x" : 0, "y" : -110, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ] },
			/* 14 */ { "x" : 0, "y" : 110, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ] },

			/* 15 */ { "x" : 0, "y" : 342.8, "trait" : "art" },
			/* 16 */ { "x" : 0, "y" : -4, "trait" : "art" },
			/* 17 */ { "x" : 0, "y" : 4, "trait" : "art" },
			/* 18 */ { "x" : 468.5, "y" : -4, "trait" : "art" },
			/* 19 */ { "x" : 468.5, "y" : 4, "trait" : "art" },
			/* 20 */ { "x" : -468.5, "y" : -4, "trait" : "art" },
			/* 21 */ { "x" : -468.5, "y" : 4, "trait" : "art" },
			/* 22 */ { "x" : 685.7, "y" : 262.8, "trait" : "art" },
			/* 23 */ { "x" : 468.5, "y" : 57.5, "trait" : "art" },
			/* 24 */ { "x" : -685.7, "y" : -262.8, "trait" : "art" },
			/* 25 */ { "x" : -468.5, "y" : -57.5, "trait" : "art" },
			/* 26 */ { "x" : -468.5, "y" : 57.5, "trait" : "art" },
			/* 27 */ { "x" : 468.5, "y" : -57.5, "trait" : "art" },
			/* 28 */ { "x" : -685.7, "y" : 262.8, "trait" : "art" },
			/* 29 */ { "x" : 685.7, "y" : -262.8, "trait" : "art" },
			/* 30 */ { "x" : -692.2, "y" : -342.8, "trait" : "art" },
			/* 31 */ { "x" : -692.2, "y" : -87.5, "trait" : "art" },
			/* 32 */ { "x" : 1543.25, "y" : 644, "trait" : "art" },
			/* 33 */ { "x" : 1543.25, "y" : 154, "trait" : "art" },
			/* 34 */ { "x" : -692.2, "y" : 342.8, "trait" : "art" },
			/* 35 */ { "x" : -692.2, "y" : 87.5, "trait" : "art" },
			/* 36 */ { "x" : 692.2, "y" : -342.8, "trait" : "art" },
			/* 37 */ { "x" : 692.2, "y" : -87.5, "trait" : "art" },
			/* 38 */ { "x" : 692.2, "y" : 342.8, "trait" : "art" },
			/* 39 */ { "x" : 692.2, "y" : 87.5, "trait" : "art" },
			/* 40 */ { "x" : 0, "y" : -377.8, "trait" : "art" },
			/* 41 */ { "x" : 0, "y" : 377.8, "trait" : "art" },
			/* 42 */ { "x" : -687.7, "y" : -87.5, "trait" : "art" },
			/* 43 */ { "x" : -687.7, "y" : 87.5, "trait" : "art" },
			/* 44 */ { "x" : 687.7, "y" : -87.5, "trait" : "art" },
			/* 45 */ { "x" : 687.7, "y" : 87.5, "trait" : "art" },
			/* 46 */ { "x" : 683.7, "y" : -87.5, "trait" : "art" },
			/* 47 */ { "x" : 683.7, "y" : 87.5, "trait" : "art" },
			/* 48 */ { "x" : -683.7, "y" : -87.5, "trait" : "art" },
			/* 49 */ { "x" : -683.7, "y" : 87.5, "trait" : "art" },
			/* 50 */ { "x" : -725.7, "y" : 94, "trait" : "art" },
			/* 51 */ { "x" : -685.7, "y" : 94, "trait" : "art" },
			/* 52 */ { "x" : -725.7, "y" : -94, "trait" : "art" },
			/* 53 */ { "x" : -685.7, "y" : -94, "trait" : "art" },
			/* 54 */ { "x" : 685.7, "y" : -94, "trait" : "art" },
			/* 55 */ { "x" : 725.7, "y" : -94, "trait" : "art" },
			/* 56 */ { "x" : 685.7, "y" : 94, "trait" : "art" },
			/* 57 */ { "x" : 725.7, "y" : 94, "trait" : "art" }

			],

			"segments" : [
			{ "v0" : 0, "v1" : 1, "trait" : "parede" },
			{ "v0" : 2, "v1" : 3, "trait" : "parede" },
			{ "v0" : 0, "v1" : 4, "trait" : "parede" },
			{ "v0" : 1, "v1" : 5, "trait" : "parede" },
			{ "v0" : 3, "v1" : 6, "trait" : "parede" },
			{ "v0" : 2, "v1" : 7, "trait" : "parede" },

			{ "v0" : 4, "v1" : 8, "trait" : "gol" },
			{ "v0" : 8, "v1" : 9, "trait" : "gol" },
			{ "v0" : 9, "v1" : 7, "trait" : "gol" },
			{ "v0" : 5, "v1" : 10, "trait" : "gol" },
			{ "v0" : 10, "v1" : 11, "trait" : "gol" },
			{ "v0" : 11, "v1" : 6, "trait" : "gol" },

			{ "v0" : 12, "v1" : 13, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "color" : "8b8b8b" },
			{ "v0" : 14, "v1" : 15, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "color" : "8b8b8b" },
			{ "curve" : 180, "v0" : 13, "v1" : 14, "cMask" : ["red","blue" ], "cGroup" : ["redKO" ], "color" : "8b8b8b" },
			{ "curve" : -180, "v0" : 13, "v1" : 14, "cMask" : ["red","blue" ], "cGroup" : ["blueKO" ], "color" : "8b8b8b" },

			{ "curve" : 0, "v0" : 13, "v1" : 14, "trait" : "art" },
			{ "curve" : -180, "v0" : 16, "v1" : 17, "trait" : "art" },
			{ "curve" : 180, "v0" : 16, "v1" : 17, "trait" : "art" },
			{ "curve" : 90, "v0" : 16, "v1" : 17, "trait" : "art" },
			{ "curve" : -90, "v0" : 16, "v1" : 17, "trait" : "art" },
			{ "curve" : -180, "v0" : 18, "v1" : 19, "trait" : "art" },
			{ "curve" : 180, "v0" : 18, "v1" : 19, "trait" : "art" },
			{ "curve" : 90, "v0" : 18, "v1" : 19, "trait" : "art" },
			{ "curve" : -90, "v0" : 18, "v1" : 19, "trait" : "art" },
			{ "curve" : -180, "v0" : 20, "v1" : 21, "trait" : "art" },
			{ "curve" : 180, "v0" : 20, "v1" : 21, "trait" : "art" },
			{ "curve" : 90, "v0" : 20, "v1" : 21, "trait" : "art" },
			{ "curve" : -90, "v0" : 20, "v1" : 21, "trait" : "art" },
			{ "curve" : 95, "v0" : 22, "v1" : 23, "trait" : "art" },
			{ "curve" : 95, "v0" : 24, "v1" : 25, "trait" : "art" },
			{ "curve" : 0, "v0" : 25, "v1" : 26, "trait" : "art" },
			{ "curve" : 0, "v0" : 23, "v1" : 27, "trait" : "art" },
			{ "curve" : 95, "v0" : 26, "v1" : 28, "trait" : "art" },
			{ "curve" : 95, "v0" : 27, "v1" : 29, "trait" : "art" },

			{ "v0" : 30, "v1" : 31, "cMask" : ["ball" ], "vis" : false },
			{ "v0" : 34, "v1" : 35, "cMask" : ["ball" ], "vis" : false },
			{ "v0" : 36, "v1" : 37, "cMask" : ["ball" ], "vis" : false },
			{ "v0" : 38, "v1" : 39, "cMask" : ["ball" ], "vis" : false },
			{ "v0" : 12, "v1" : 40, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "vis" : false },
			{ "v0" : 15, "v1" : 41, "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "vis" : false },
			{ "v0" : 5, "v1" : 6, "cMask" : ["" ], "color" : "00008b" },
			{ "v0" : 4, "v1" : 7, "cMask" : ["" ], "color" : "8b0000" },
			{ "v0" : 42, "v1" : 43, "cMask" : ["" ], "color" : "555555" },
			{ "v0" : 44, "v1" : 45, "cMask" : ["" ], "color" : "555555" },
			{ "v0" : 46, "v1" : 47, "cMask" : ["" ], "color" : "555555" },
			{ "v0" : 48, "v1" : 49, "cMask" : ["" ], "color" : "555555" },
			{ "v0" : 50, "v1" : 51, "cMask" : ["ball" ], "vis" : false },
			{ "v0" : 52, "v1" : 53, "cMask" : ["ball" ], "vis" : false },
			{ "v0" : 54, "v1" : 55, "cMask" : ["ball" ], "vis" : false },
			{ "v0" : 56, "v1" : 57, "cMask" : ["ball" ], "vis" : false }

			],

			"goals" : [
			{ "p0" : [-691.7,87.5 ], "p1" : [-691.7,-87.5 ], "team" : "red" },
			{ "p0" : [691.7,87.5 ], "p1" : [691.7,-87.5 ], "team" : "blue" }

			],

			"discs" : [
			{ "pos" : [-685.7,-87.5 ], "radius" : 4.5, "invMass" : 0, "color" : "8b0000" },
			{ "pos" : [685.7,-87.5 ], "radius" : 4.5, "invMass" : 0, "color" : "00008b" },
			{ "pos" : [-685.7,87.5 ], "radius" : 4.5, "invMass" : 0, "color" : "8b0000" },
			{ "pos" : [685.7,87.5 ], "radius" : 4.5, "invMass" : 0, "color" : "00008b" },
			{ "pos" : [685.7,342.8 ], "radius" : 3, "cGroup" : ["" ], "color" : "00008b" },
			{ "pos" : [-685.7,342.8 ], "radius" : 3, "cGroup" : ["" ], "color" : "8b0000" },
			{ "pos" : [-685.7,-342.8 ], "radius" : 3, "cGroup" : ["" ], "color" : "8b0000" },
			{ "pos" : [685.7,-342.8 ], "radius" : 3, "cGroup" : ["" ], "color" : "00008b" }

			],

			"planes" : [
			{ "dist" : -342.8, "normal" : [0,1 ], "cMask" : ["ball" ], "bCoef" : 1 },
			{ "dist" : -342.8, "normal" : [0,-1 ], "cMask" : ["ball" ], "bCoef" : 1 },
			{ "dist" : -725.7, "normal" : [-1,0 ], "cMask" : ["ball" ], "bCoef" : 0.1 },
			{ "dist" : -725.7, "normal" : [1,0 ], "cMask" : ["ball" ], "bCoef" : 0.1 },
			{ "dist" : -377.8, "normal" : [0,1 ] },
			{ "dist" : -377.8, "normal" : [0,-1 ] },
			{ "dist" : -760.7, "normal" : [1,0 ] },
			{ "dist" : -760.7, "normal" : [-1,0 ] }

			],

			"traits" : {
				"art" : { "cGroup" : ["" ], "cMask" : ["" ], "color" : "8b8b8b" },
				"parede" : { "cMask" : ["ball" ], "color" : "8b8b8b", "bCoef" : 1 },
				"gol" : { "cMask" : ["ball" ], "color" : "8b8b8b", "bCoef" : 0.1 }

			},

			"playerPhysics" : {
				"acceleration" : 0.11,
				"kickingAcceleration" : 0.083,
				"kickStrength" : 5.2,
				"bCoef" : 0

			},

			"ballPhysics" : {
				"radius" : 6.25,
				"bCoef" : 0.35,
				"invMass" : 1.5,
				"color" : "ffd700"

			}
		}`




		var penalRed = `{

			"name" : "🌟 𝗣𝗘𝗡𝗔𝗟𝗧𝗜 𝗥𝗘𝗗 𝘅𝟰 🎩",

			"width" : 480,

			"height" : 360,

			"spawnDistance" : 480,

			"bg" : { "type" : "hockey" },

			"vertexes" : [
			/* 0 */ { "x" : 480, "y" : -360, "trait" : "art" },
			/* 1 */ { "x" : 380, "y" : -35, "trait" : "art" },
			/* 2 */ { "x" : 380, "y" : 35, "trait" : "art" },
			/* 3 */ { "x" : 480, "y" : 360, "trait" : "art" },
			/* 4 */ { "x" : -380, "y" : -360, "trait" : "art" },
			/* 5 */ { "x" : -380, "y" : -35, "trait" : "art" },
			/* 6 */ { "x" : -380, "y" : 35, "trait" : "art" },
			/* 7 */ { "x" : -380, "y" : 360, "trait" : "art" },
			/* 8 */ { "x" : -230, "y" : -87.5, "trait" : "art" },
			/* 9 */ { "x" : -230, "y" : 87.5, "trait" : "art" },
			/* 10 */ { "x" : -270, "y" : -87.5, "trait" : "art" },
			/* 11 */ { "x" : -270, "y" : 87.5, "trait" : "art" },
			/* 12 */ { "x" : -230, "y" : -360, "trait" : "art" },
			/* 13 */ { "x" : -230, "y" : 360, "trait" : "art" },
			/* 14 */ { "x" : 0, "y" : -57.5, "trait" : "art" },
			/* 15 */ { "x" : -230, "y" : -265, "trait" : "art" },
			/* 16 */ { "x" : -230, "y" : 265, "trait" : "art" },
			/* 17 */ { "x" : 0, "y" : 57.5, "trait" : "art" },
			/* 18 */ { "x" : 0, "y" : 4, "trait" : "art" },
			/* 19 */ { "x" : 0, "y" : -4, "trait" : "art" },
			/* 20 */ { "x" : -230, "y" : -87.5, "trait" : "art" },
			/* 21 */ { "x" : -230, "y" : -360, "trait" : "art" },
			/* 22 */ { "x" : -230, "y" : 87.5, "trait" : "art" },
			/* 23 */ { "x" : -230, "y" : 360, "trait" : "art" },
			/* 24 */ { "x" : -215, "y" : -87.5, "trait" : "art" },
			/* 25 */ { "x" : -215, "y" : 87.5, "trait" : "art" },
			/* 26 */ { "x" : -245, "y" : -360, "trait" : "art" },
			/* 27 */ { "x" : -245, "y" : -15, "trait" : "art" },
			/* 28 */ { "x" : -245, "y" : 15, "trait" : "art" },
			/* 29 */ { "x" : -245, "y" : 360, "trait" : "art" },
			/* 30 */ { "x" : -245, "y" : -15, "trait" : "art" },
			/* 31 */ { "x" : -360, "y" : -15, "trait" : "art" },
			/* 32 */ { "x" : -360, "y" : 15, "trait" : "art" },
			/* 33 */ { "x" : -245, "y" : 15, "trait" : "art" },
			/* 34 */ { "x" : 380, "y" : -360, "trait" : "art" },
			/* 35 */ { "x" : 380, "y" : 360, "trait" : "art" },
			/* 36 */ { "x" : -228, "y" : -87.5, "trait" : "art" },
			/* 37 */ { "x" : -228, "y" : 87.5, "trait" : "art" },
			/* 38 */ { "x" : -232, "y" : -87.5, "trait" : "art" },
			/* 39 */ { "x" : -232, "y" : 87.5, "trait" : "art" },
			/* 40 */ { "x" : -230, "y" : 360, "trait" : "art" },
			/* 41 */ { "x" : -230, "y" : -360, "trait" : "art" },

			/* 42 */ { "x" : 0, "y" : 0, "cMask" : ["blue" ] },
			/* 43 */ { "x" : 0, "y" : 0, "cMask" : ["blue" ] },

			/* 44 */ { "x" : -358, "y" : -15, "trait" : "art" },
			/* 45 */ { "x" : -358, "y" : 15, "trait" : "art" },
			/* 46 */ { "x" : -362, "y" : -14, "trait" : "art" },
			/* 47 */ { "x" : -362, "y" : 14, "trait" : "art" },
			/* 48 */ { "x" : 360, "y" : -15, "trait" : "art" },
			/* 49 */ { "x" : 360, "y" : 15, "trait" : "art" },
			/* 50 */ { "x" : 362, "y" : -15, "trait" : "art" },
			/* 51 */ { "x" : 362, "y" : 15, "trait" : "art" },
			/* 52 */ { "x" : 358, "y" : -15, "trait" : "art" },
			/* 53 */ { "x" : 358, "y" : 15, "trait" : "art" }

			],

			"segments" : [
			{ "v0" : 8, "v1" : 9, "trait" : "art", "color" : "8b0000" },

			{ "v0" : 10, "v1" : 11, "trait" : "gol" },
			{ "v0" : 10, "v1" : 8, "trait" : "gol" },
			{ "v0" : 11, "v1" : 9, "trait" : "gol" },

			{ "v0" : 14, "v1" : 15, "curve" : -95, "trait" : "bloqueio" },
			{ "v0" : 16, "v1" : 17, "curve" : -95, "trait" : "bloqueio" },
			{ "v0" : 14, "v1" : 17, "trait" : "bloqueio" },
			{ "v0" : 18, "v1" : 19, "curve" : 90, "trait" : "bloqueio" },
			{ "v0" : 19, "v1" : 18, "curve" : 90, "trait" : "bloqueio" },
			{ "v0" : 18, "v1" : 19, "curve" : 180, "trait" : "bloqueio" },
			{ "v0" : 19, "v1" : 18, "curve" : 180, "trait" : "bloqueio" },

			{ "v0" : 0, "v1" : 12, "trait" : "parede" },
			{ "v0" : 3, "v1" : 13, "trait" : "parede" },
			{ "v0" : 20, "v1" : 21, "trait" : "parede" },
			{ "v0" : 22, "v1" : 23, "trait" : "parede" },

			{ "v0" : 24, "v1" : 25, "trait" : "bloqueioinvi" },
			{ "v0" : 4, "v1" : 5, "trait" : "bloqueioinvi" },
			{ "v0" : 6, "v1" : 7, "trait" : "bloqueioinvi" },
			{ "v0" : 26, "v1" : 27, "trait" : "bloqueioinvi" },
			{ "v0" : 28, "v1" : 29, "trait" : "bloqueioinvi" },
			{ "v0" : 5, "v1" : 31, "trait" : "bloqueioinvi", "curve" : -90 },
			{ "v0" : 6, "v1" : 32, "trait" : "bloqueioinvi", "curve" : 90 },
			{ "v0" : 31, "v1" : 30, "trait" : "bloqueioinvi" },
			{ "v0" : 32, "v1" : 33, "trait" : "bloqueioinvi" },
			{ "v0" : 1, "v1" : 34, "trait" : "bloqueioinvi" },
			{ "v0" : 2, "v1" : 35, "trait" : "bloqueioinvi" },
			{ "v0" : 37, "v1" : 40, "trait" : "bloqueioinvi" },
			{ "v0" : 38, "v1" : 41, "trait" : "bloqueioinvi" },
			{ "v0" : 49, "v1" : 2, "trait" : "bloqueioinvi", "curve" : 90 },
			{ "v0" : 1, "v1" : 48, "trait" : "bloqueioinvi", "curve" : 90 },

			{ "v0" : 36, "v1" : 37, "trait" : "linhacamuflada" },
			{ "v0" : 38, "v1" : 39, "trait" : "linhacamuflada" },

			{ "v0" : 31, "v1" : 32, "trait" : "art", "color" : "8b0000" },

			{ "v0" : 42, "v1" : 43, "cMask" : ["red" ] },

			{ "v0" : 44, "v1" : 45, "trait" : "linhacamuflada" },
			{ "v0" : 46, "v1" : 47, "trait" : "linhacamuflada" },

			{ "v0" : 48, "v1" : 49, "trait" : "art", "color" : "00008b" },

			{ "v0" : 50, "v1" : 51, "trait" : "linhacamuflada" },
			{ "v0" : 52, "v1" : 53, "trait" : "linhacamuflada" }

			],

			"goals" : [
			{ "team" : "blue", "p0" : [-230,-92.5 ], "p1" : [20,0 ] },
			{ "team" : "blue", "p0" : [-230,92.5 ], "p1" : [20,0 ] },
			{ "team" : "red", "p0" : [-236,87.5 ], "p1" : [-236,-87.5 ] }

			],

			"discs" : [
			{ "pos" : [-230,-87.5 ], "radius" : 4.5, "invMass" : 0, "color" : "8b0000" },
			{ "pos" : [-230,87.5 ], "radius" : 4.5, "invMass" : 0, "color" : "8b0000" },
			{ "pos" : [-230,-360 ], "radius" : 3, "cGroup" : ["" ], "color" : "8b0000" },
			{ "pos" : [-230,360 ], "radius" : 3, "cGroup" : ["" ], "color" : "8b0000" },
			{ "pos" : [360,15 ], "radius" : 2, "cGroup" : ["" ], "color" : "00008b" },
			{ "pos" : [360,-15 ], "radius" : 2, "cGroup" : ["" ], "color" : "00008b" },
			{ "pos" : [-360,15 ], "radius" : 2, "cGroup" : ["" ], "color" : "8b0000" },
			{ "pos" : [-360,-15 ], "radius" : 2, "cGroup" : ["" ], "color" : "8b0000" }

			],

			"planes" : [
			{ "dist" : -360, "normal" : [0,1 ] },
			{ "dist" : -360, "normal" : [0,-1 ] },
			{ "dist" : -480, "normal" : [1,0 ] },
			{ "dist" : -480, "normal" : [-1,0 ] }

			],

			"traits" : {
				"art" : { "cGroup" : ["" ], "cMask" : ["" ] },
				"parede" : { "cMask" : ["ball" ], "color" : "8b8b8b", "bCoef" : 1 },
				"gol" : { "cMask" : ["ball" ], "bCoef" : 0.1, "color" : "8b8b8b" },
				"bloqueio" : { "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "color" : "8b8b8b" },
				"bloqueioinvi" : { "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "vis" : false },
				"linhacamuflada" : { "cGroup" : ["" ], "cMask" : ["" ], "color" : "555555" }

			},

			"playerPhysics" : {
				"acceleration" : 0.11,
				"kickingAcceleration" : 0.083,
				"kickStrength" : 5,
				"bCoef" : 0

			},

			"ballPhysics" : {
				"radius" : 6.25,
				"bCoef" : 0.35,
				"color" : "ffd700",
				"invMass" : 1.5

			}
		}`


		var penalBlue = `{

			"name" : "🌟 𝗣𝗘𝗡𝗔𝗟𝗧𝗜 𝗕𝗟𝗨𝗘 𝘅𝟰 🎩",

			"width" : 480,

			"height" : 360,

			"spawnDistance" : 480,

			"bg" : { "type" : "hockey" },

			"vertexes" : [
			/* 0 */ { "x" : -480, "y" : -360, "trait" : "art" },
			/* 1 */ { "x" : -380, "y" : -35, "trait" : "art" },
			/* 2 */ { "x" : -380, "y" : 35, "trait" : "art" },
			/* 3 */ { "x" : -480, "y" : 360, "trait" : "art" },
			/* 4 */ { "x" : 380, "y" : -360, "trait" : "art" },
			/* 5 */ { "x" : 380, "y" : -35, "trait" : "art" },
			/* 6 */ { "x" : 380, "y" : 35, "trait" : "art" },
			/* 7 */ { "x" : 380, "y" : 360, "trait" : "art" },
			/* 8 */ { "x" : 230, "y" : -87.5, "trait" : "art" },
			/* 9 */ { "x" : 230, "y" : 87.5, "trait" : "art" },
			/* 10 */ { "x" : 270, "y" : -87.5, "trait" : "art" },
			/* 11 */ { "x" : 270, "y" : 87.5, "trait" : "art" },
			/* 12 */ { "x" : 230, "y" : -360, "trait" : "art" },
			/* 13 */ { "x" : 230, "y" : 360, "trait" : "art" },
			/* 14 */ { "x" : 0, "y" : -57.5, "trait" : "art" },
			/* 15 */ { "x" : 230, "y" : -265, "trait" : "art" },
			/* 16 */ { "x" : 230, "y" : 265, "trait" : "art" },
			/* 17 */ { "x" : 0, "y" : 57.5, "trait" : "art" },
			/* 18 */ { "x" : 0, "y" : 4, "trait" : "art" },
			/* 19 */ { "x" : 0, "y" : -4, "trait" : "art" },
			/* 20 */ { "x" : 230, "y" : -87.5, "trait" : "art" },
			/* 21 */ { "x" : 230, "y" : -360, "trait" : "art" },
			/* 22 */ { "x" : 230, "y" : 87.5, "trait" : "art" },
			/* 23 */ { "x" : 230, "y" : 360, "trait" : "art" },
			/* 24 */ { "x" : 215, "y" : -87.5, "trait" : "art" },
			/* 25 */ { "x" : 215, "y" : 87.5, "trait" : "art" },
			/* 26 */ { "x" : 245, "y" : -360, "trait" : "art" },
			/* 27 */ { "x" : 245, "y" : -15, "trait" : "art" },
			/* 28 */ { "x" : 245, "y" : 15, "trait" : "art" },
			/* 29 */ { "x" : 245, "y" : 360, "trait" : "art" },
			/* 30 */ { "x" : 245, "y" : -15, "trait" : "art" },
			/* 31 */ { "x" : 360, "y" : -15, "trait" : "art" },
			/* 32 */ { "x" : 360, "y" : 15, "trait" : "art" },
			/* 33 */ { "x" : 245, "y" : 15, "trait" : "art" },
			/* 34 */ { "x" : -380, "y" : -360, "trait" : "art" },
			/* 35 */ { "x" : -380, "y" : 360, "trait" : "art" },
			/* 36 */ { "x" : 228, "y" : -87.5, "trait" : "art" },
			/* 37 */ { "x" : 228, "y" : 87.5, "trait" : "art" },
			/* 38 */ { "x" : 232, "y" : -87.5, "trait" : "art" },
			/* 39 */ { "x" : 232, "y" : 87.5, "trait" : "art" },
			/* 40 */ { "x" : 230, "y" : 360, "trait" : "art" },
			/* 41 */ { "x" : 230, "y" : -360, "trait" : "art" },

			/* 42 */ { "x" : 0, "y" : 0, "cMask" : ["red" ] },
			/* 43 */ { "x" : 0, "y" : 0, "cMask" : ["red" ] },

			/* 44 */ { "x" : 358, "y" : -15, "trait" : "art" },
			/* 45 */ { "x" : 358, "y" : 15, "trait" : "art" },
			/* 46 */ { "x" : 362, "y" : -14, "trait" : "art" },
			/* 47 */ { "x" : 362, "y" : 14, "trait" : "art" },
			/* 48 */ { "x" : -360, "y" : -15, "trait" : "art" },
			/* 49 */ { "x" : -360, "y" : 15, "trait" : "art" },
			/* 50 */ { "x" : -362, "y" : -15, "trait" : "art" },
			/* 51 */ { "x" : -362, "y" : 15, "trait" : "art" },
			/* 52 */ { "x" : -358, "y" : -15, "trait" : "art" },
			/* 53 */ { "x" : -358, "y" : 15, "trait" : "art" }

			],

			"segments" : [
			{ "v0" : 8, "v1" : 9, "trait" : "art", "color" : "00008b" },

			{ "v0" : 10, "v1" : 11, "trait" : "gol" },
			{ "v0" : 10, "v1" : 8, "trait" : "gol" },
			{ "v0" : 11, "v1" : 9, "trait" : "gol" },

			{ "v0" : 14, "v1" : 15, "curve" : 95, "trait" : "bloqueio" },
			{ "v0" : 16, "v1" : 17, "curve" : 95, "trait" : "bloqueio" },
			{ "v0" : 14, "v1" : 17, "trait" : "bloqueio" },
			{ "v0" : 18, "v1" : 19, "curve" : 90, "trait" : "bloqueio" },
			{ "v0" : 19, "v1" : 18, "curve" : 90, "trait" : "bloqueio" },
			{ "v0" : 18, "v1" : 19, "curve" : 180, "trait" : "bloqueio" },
			{ "v0" : 19, "v1" : 18, "curve" : 180, "trait" : "bloqueio" },

			{ "v0" : 0, "v1" : 12, "trait" : "parede" },
			{ "v0" : 3, "v1" : 13, "trait" : "parede" },
			{ "v0" : 20, "v1" : 21, "trait" : "parede" },
			{ "v0" : 22, "v1" : 23, "trait" : "parede" },

			{ "v0" : 24, "v1" : 25, "trait" : "bloqueioinvi" },
			{ "v0" : 4, "v1" : 5, "trait" : "bloqueioinvi" },
			{ "v0" : 6, "v1" : 7, "trait" : "bloqueioinvi" },
			{ "v0" : 26, "v1" : 27, "trait" : "bloqueioinvi" },
			{ "v0" : 28, "v1" : 29, "trait" : "bloqueioinvi" },
			{ "v0" : 5, "v1" : 31, "trait" : "bloqueioinvi", "curve" : 90 },
			{ "v0" : 6, "v1" : 32, "trait" : "bloqueioinvi", "curve" : -90 },
			{ "v0" : 31, "v1" : 30, "trait" : "bloqueioinvi" },
			{ "v0" : 32, "v1" : 33, "trait" : "bloqueioinvi" },
			{ "v0" : 1, "v1" : 34, "trait" : "bloqueioinvi" },
			{ "v0" : 2, "v1" : 35, "trait" : "bloqueioinvi" },
			{ "v0" : 37, "v1" : 40, "trait" : "bloqueioinvi" },
			{ "v0" : 38, "v1" : 41, "trait" : "bloqueioinvi" },
			{ "v0" : 49, "v1" : 2, "trait" : "bloqueioinvi", "curve" : -90 },
			{ "v0" : 1, "v1" : 48, "trait" : "bloqueioinvi", "curve" : -90 },

			{ "v0" : 36, "v1" : 37, "trait" : "linhacamuflada" },
			{ "v0" : 38, "v1" : 39, "trait" : "linhacamuflada" },

			{ "v0" : 31, "v1" : 32, "trait" : "art", "color" : "00008b" },

			{ "v0" : 42, "v1" : 43, "cMask" : ["red" ] },

			{ "v0" : 44, "v1" : 45, "trait" : "linhacamuflada" },
			{ "v0" : 46, "v1" : 47, "trait" : "linhacamuflada" },

			{ "v0" : 48, "v1" : 49, "trait" : "art", "color" : "8b0000" },

			{ "v0" : 50, "v1" : 51, "trait" : "linhacamuflada" },
			{ "v0" : 52, "v1" : 53, "trait" : "linhacamuflada" }

			],

			"goals" : [
			{ "team" : "red", "p0" : [230,-92.5 ], "p1" : [-20,0 ] },
			{ "team" : "red", "p0" : [230,92.5 ], "p1" : [-20,0 ] },
			{ "team" : "blue", "p0" : [236,87.5 ], "p1" : [236,-87.5 ] }

			],

			"discs" : [
			{ "pos" : [230,-87.5 ], "radius" : 4.5, "invMass" : 0, "color" : "00008b" },
			{ "pos" : [230,87.5 ], "radius" : 4.5, "invMass" : 0, "color" : "00008b" },
			{ "pos" : [230,-360 ], "radius" : 3, "cGroup" : ["" ], "color" : "00008b" },
			{ "pos" : [230,360 ], "radius" : 3, "cGroup" : ["" ], "color" : "00008b" },
			{ "pos" : [-360,15 ], "radius" : 2, "cGroup" : ["" ], "color" : "8b0000" },
			{ "pos" : [-360,-15 ], "radius" : 2, "cGroup" : ["" ], "color" : "8b0000" },
			{ "pos" : [360,15 ], "radius" : 2, "cGroup" : ["" ], "color" : "00008b" },
			{ "pos" : [360,-15 ], "radius" : 2, "cGroup" : ["" ], "color" : "00008b" }

			],

			"planes" : [
			{ "dist" : -360, "normal" : [0,1 ] },
			{ "dist" : -360, "normal" : [0,-1 ] },
			{ "dist" : -480, "normal" : [1,0 ] },
			{ "dist" : -480, "normal" : [-1,0 ] }

			],

			"traits" : {
				"art" : { "cGroup" : ["" ], "cMask" : ["" ] },
				"parede" : { "cMask" : ["ball" ], "color" : "8b8b8b", "bCoef" : 1 },
				"gol" : { "cMask" : ["ball" ], "bCoef" : 0.1, "color" : "8b8b8b" },
				"bloqueio" : { "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "color" : "8b8b8b" },
				"bloqueioinvi" : { "cMask" : ["red","blue" ], "cGroup" : ["redKO","blueKO" ], "vis" : false },
				"linhacamuflada" : { "cGroup" : ["" ], "cMask" : ["" ], "color" : "555555" }

			},

			"playerPhysics" : {
				"acceleration" : 0.11,
				"kickingAcceleration" : 0.083,
				"kickStrength" : 5,
				"bCoef" : 0

			},

			"ballPhysics" : {
				"radius" : 6.25,
				"bCoef" : 0.35,
				"color" : "ffd700",
				"invMass" : 1.5

			}
		}`


		var futsalTraining = `
		{"name":"Futsal x1 and x2 ; by Bazinga! & GLH from HaxMaps","width":420,"height":200,"spawnDistance":180,"bg":{"type":"hockey","width":368,"height":171,"kickOffRadius":65,"cornerRadius":0},"vertexes":[{"x":-368,"y":171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":-368,"y":65,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":-368,"y":-65,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":-368,"y":-171,"trait":"ballArea","bCoef":1,"cMask":["ball"]},{"x":368,"y":171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":368,"y":65,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":368,"y":-65,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":368,"y":-171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":0,"y":65,"trait":"kickOffBarrier"},{"x":0,"y":-65,"trait":"line"},{"bCoef":1,"trait":"ballArea","x":368,"y":171},{"bCoef":1,"trait":"ballArea","x":368,"y":-171},{"bCoef":0,"trait":"line","x":0,"y":171},{"bCoef":0,"trait":"line","x":0,"y":-171},{"x":0,"y":65,"trait":"kickOffBarrier"},{"x":0,"y":-65,"trait":"kickOffBarrier"},{"x":377,"y":-65,"trait":"line","cMask":["ball"],"bCoef":1},{"x":377,"y":-171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":-377,"y":-65,"trait":"line","cMask":["ball"],"bCoef":1},{"x":-377,"y":-171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":-377,"y":65,"trait":"line","cMask":["ball"],"bCoef":1},{"x":-377,"y":171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":377,"y":65,"trait":"line","cMask":["ball"],"bCoef":1},{"x":377,"y":171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":0,"y":199,"trait":"kickOffBarrier"},{"x":0,"y":65,"trait":"kickOffBarrier"},{"x":0,"y":-65,"trait":"kickOffBarrier"},{"x":0,"y":-199,"trait":"kickOffBarrier"},{"x":-368.53340356886,"y":-62.053454903872,"cMask":["red","blue","ball"],"trait":"goalNet","curve":0,"color":"F8F8F8","pos":[-700,-80]},{"x":-400.05760771891,"y":-62.053454903872,"cMask":["red","blue","ball"],"trait":"goalNet","curve":0,"color":"F8F8F8","pos":[-700,-80]},{"x":-400.05760771891,"y":64.043361696331,"cMask":["red","blue","ball"],"trait":"goalNet","curve":0,"color":"F8F8F8","pos":[-700,80]},{"x":-368.53340356886,"y":64.043361696331,"cMask":["red","blue","ball"],"trait":"goalNet","curve":0,"color":"F8F8F8","pos":[-700,80]},{"x":368.09926357786,"y":63.94882446641,"cMask":["red","blue","ball"],"trait":"goalNet","curve":0,"color":"F8F8F8","pos":[-700,-80]},{"x":400,"y":64,"cMask":["red","blue","ball"],"trait":"goalNet","curve":0,"color":"F8F8F8","pos":[-700,-80]},{"x":400,"y":-61.927767991658,"cMask":["red","blue","ball"],"trait":"goalNet","curve":0,"color":"F8F8F8","pos":[-700,80]},{"x":368.9681846993,"y":-62.144998272018,"cMask":["red","blue","ball"],"trait":"goalNet","curve":0,"color":"F8F8F8","pos":[-700,80]},{"x":-368,"y":-142.37229643041,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":-90},{"x":-260.90035258157,"y":-50.168480548544,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":0},{"x":-368,"y":-160.81305960678,"bCoef":0.1,"trait":"line","curve":-90},{"x":-358.5379338963,"y":-171,"bCoef":0.1,"trait":"line","curve":-90},{"x":-368,"y":141.33175243687,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":90},{"x":-260.90035258157,"y":49.127936555002,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":0},{"x":-368,"y":159.77251561324,"bCoef":0.1,"trait":"line","curve":90},{"x":-358.5379338963,"y":171,"bCoef":0.1,"trait":"line","curve":90},{"x":368,"y":159.77251561324,"bCoef":0.1,"trait":"line","curve":-90},{"x":358.36266315432,"y":171,"bCoef":0.1,"trait":"line","curve":-90},{"x":368,"y":-160.81305960678,"bCoef":0.1,"trait":"line","curve":90},{"x":358.36266315432,"y":-171,"bCoef":0.1,"trait":"line","curve":90},{"x":368,"y":-142.37229643041,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":90},{"x":260.72508183959,"y":-50.168480548544,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":90},{"x":368,"y":141.33175243687,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":-90},{"x":260.72508183959,"y":49.127936555002,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":-90},{"x":260.72508183959,"y":-50.168480548544,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":0},{"x":260.72508183959,"y":49.127936555002,"bCoef":0.1,"trait":"line","color":"F8F8F8","curve":0},{"x":-250.86909422732,"y":-1.2295321189394,"bCoef":0.1,"trait":"line","curve":180},{"x":-250.86909422732,"y":0.18898812539692,"bCoef":0.1,"trait":"line","curve":180},{"x":-250.86909422732,"y":-2.6480523632758,"bCoef":0.1,"trait":"line","curve":180},{"x":-250.86909422732,"y":1.6075083697333,"bCoef":0.1,"trait":"line","curve":180},{"x":-250.86909422732,"y":0.89824824756514,"bCoef":0.1,"trait":"line","curve":180},{"x":-250.86909422732,"y":-1.9387922411076,"bCoef":0.1,"trait":"line","curve":180},{"x":-250.86909422732,"y":1.9621384308174,"bCoef":0.1,"trait":"line","curve":180},{"x":-250.86909422732,"y":-3.0026824243599,"bCoef":0.1,"trait":"line","curve":180},{"x":250.69382348534,"y":-1.2295321189394,"bCoef":0.1,"trait":"line","curve":180},{"x":250.69382348534,"y":0.18898812539692,"bCoef":0.1,"trait":"line","curve":180},{"x":250.69382348534,"y":-2.6480523632758,"bCoef":0.1,"trait":"line","curve":180},{"x":250.69382348534,"y":1.6075083697333,"bCoef":0.1,"trait":"line","curve":180},{"x":250.69382348534,"y":0.89824824756514,"bCoef":0.1,"trait":"line","curve":180},{"x":250.69382348534,"y":-1.9387922411076,"bCoef":0.1,"trait":"line","curve":180},{"x":250.69382348534,"y":1.9621384308174,"bCoef":0.1,"trait":"line","curve":180},{"x":250.69382348534,"y":-3.0026824243599,"bCoef":0.1,"trait":"line","curve":180},{"x":-185.66591492467,"y":-1.2295321189394,"bCoef":0.1,"trait":"line","curve":180},{"x":-185.66591492467,"y":0.18898812539692,"bCoef":0.1,"trait":"line","curve":180},{"x":-185.66591492467,"y":-2.6480523632758,"bCoef":0.1,"trait":"line","curve":180},{"x":-185.66591492467,"y":1.6075083697333,"bCoef":0.1,"trait":"line","curve":180},{"x":-185.66591492467,"y":0.89824824756514,"bCoef":0.1,"trait":"line","curve":180},{"x":-185.66591492467,"y":-1.9387922411076,"bCoef":0.1,"trait":"line","curve":180},{"x":-185.66591492467,"y":1.9621384308174,"bCoef":0.1,"trait":"line","curve":180},{"x":-185.66591492467,"y":-3.0026824243599,"bCoef":0.1,"trait":"line","curve":180},{"x":185.49064418269,"y":-1.2295321189394,"bCoef":0.1,"trait":"line","curve":180},{"x":185.49064418269,"y":0.18898812539692,"bCoef":0.1,"trait":"line","curve":180},{"x":185.49064418269,"y":-2.6480523632758,"bCoef":0.1,"trait":"line","curve":180},{"x":185.49064418269,"y":1.6075083697333,"bCoef":0.1,"trait":"line","curve":180},{"x":185.49064418269,"y":0.89824824756514,"bCoef":0.1,"trait":"line","curve":180},{"x":185.49064418269,"y":-1.9387922411076,"bCoef":0.1,"trait":"line","curve":180},{"x":185.49064418269,"y":1.9621384308174,"bCoef":0.1,"trait":"line","curve":180},{"x":185.49064418269,"y":-3.0026824243599,"bCoef":0.1,"trait":"line","curve":180},{"x":-160.58776903904,"y":-159.39453936245,"bCoef":0.1,"trait":"line"},{"x":-160.58776903904,"y":-182.09086327183,"bCoef":0.1,"trait":"line"},{"x":-80.337702205015,"y":-159.39453936245,"bCoef":0.1,"trait":"line"},{"x":-80.337702205015,"y":-182.09086327183,"bCoef":0.1,"trait":"line"},{"x":160.41249829706,"y":-159.39453936245,"bCoef":0.1,"trait":"line"},{"x":160.41249829706,"y":-182.09086327183,"bCoef":0.1,"trait":"line"},{"x":80.162431463036,"y":-159.39453936245,"bCoef":0.1,"trait":"line"},{"x":80.162431463036,"y":-182.09086327183,"bCoef":0.1,"trait":"line"},{"x":-254.88159756902,"y":-171,"bCoef":0.1,"trait":"line"},{"x":-254.88159756902,"y":-182.09086327183,"bCoef":0.1,"trait":"line"},{"x":-371.91294503531,"y":-87.759267023458,"bCoef":0.1,"trait":"line"},{"x":-384.61920561736,"y":-87.759267023458,"bCoef":0.1,"trait":"line"},{"x":371.73767429333,"y":-87.759267023458,"bCoef":0.1,"trait":"line"},{"x":384.44393487538,"y":-87.759267023458,"bCoef":0.1,"trait":"line"},{"x":-371.91294503531,"y":86.718723029916,"bCoef":0.1,"trait":"line"},{"x":-384.61920561736,"y":86.718723029916,"bCoef":0.1,"trait":"line"},{"x":371.73767429333,"y":86.718723029916,"bCoef":0.1,"trait":"line"},{"x":384.44393487538,"y":86.718723029916,"bCoef":0.1,"trait":"line"},{"x":-254.88159756902,"y":171,"bCoef":0.1,"trait":"line"},{"x":-254.88159756902,"y":181.05031927829,"bCoef":0.1,"trait":"line"},{"x":254.70632682704,"y":-171,"bCoef":0.1,"trait":"line"},{"x":254.70632682704,"y":-182.09086327183,"bCoef":0.1,"trait":"line"},{"x":254.70632682704,"y":171,"bCoef":0.1,"trait":"line"},{"x":254.70632682704,"y":181.05031927829,"bCoef":0.1,"trait":"line"},{"x":377,"y":-65,"trait":"line","cMask":["ball"],"bCoef":1},{"x":377,"y":-171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":-377,"y":-65,"trait":"line","cMask":["ball"],"bCoef":1},{"x":-377,"y":-171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":-377,"y":65,"trait":"line","cMask":["ball"],"bCoef":1},{"x":-377,"y":171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":377,"y":65,"trait":"line","cMask":["ball"],"bCoef":1},{"x":377,"y":171,"trait":"ballArea","cMask":["ball"],"bCoef":1},{"x":371,"y":-65,"trait":"ballArea","cMask":["ball"],"bCoef":0},{"x":371,"y":-171,"trait":"ballArea","cMask":["ball"],"bCoef":0},{"x":371,"y":65,"trait":"ballArea","cMask":["ball"],"bCoef":0},{"x":371,"y":171,"trait":"ballArea","cMask":["ball"],"bCoef":0},{"x":-371,"y":65,"trait":"ballArea","cMask":["ball"],"bCoef":0},{"x":-371,"y":171,"trait":"ballArea","cMask":["ball"],"bCoef":0},{"x":-371,"y":-65,"trait":"ballArea","cMask":["ball"],"bCoef":0},{"x":-371,"y":-171,"trait":"ballArea","cMask":["ball"],"bCoef":0}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":8,"v1":9,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":8,"v1":9,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"vis":true,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":1,"v1":0,"cMask":["ball"],"x":-368},{"vis":true,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":5,"v1":4,"cMask":["ball"],"x":368},{"vis":true,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":2,"v1":3,"cMask":["ball"],"x":-368},{"vis":true,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":6,"v1":7,"cMask":["ball"],"x":368},{"vis":true,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":0,"v1":10,"y":171},{"vis":true,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":3,"v1":11,"y":-171},{"curve":0,"vis":true,"color":"FFFFFF","bCoef":0,"trait":"line","v0":12,"v1":13},{"curve":-180,"vis":true,"color":"FFFFFF","bCoef":0,"trait":"line","v0":9,"v1":8},{"curve":180,"vis":true,"color":"FFFFFF","bCoef":0,"trait":"line","v0":15,"v1":14},{"curve":0,"vis":true,"color":"FFFFFF","bCoef":0,"trait":"line","v0":2,"v1":1},{"curve":0,"vis":true,"color":"FFFFFF","bCoef":0,"trait":"line","v0":6,"v1":5},{"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":16,"v1":17,"cMask":["ball"],"x":330},{"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":18,"v1":19,"cMask":["ball"],"x":-330},{"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":20,"v1":21,"cMask":["ball"],"x":-330},{"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":22,"v1":23,"cMask":["ball"],"x":330},{"v0":24,"v1":25,"trait":"kickOffBarrier"},{"v0":26,"v1":27,"trait":"kickOffBarrier"},{"v0":28,"v1":29,"curve":0,"color":"F8F8F8","cMask":["red","blue","ball"],"trait":"goalNet","pos":[-700,-80],"y":-80},{"v0":29,"v1":30,"color":"F8F8F8","cMask":["red","blue","ball"],"trait":"goalNet","x":-590},{"v0":30,"v1":31,"curve":0,"color":"F8F8F8","cMask":["red","blue","ball"],"trait":"goalNet","pos":[-700,80],"y":80},{"v0":32,"v1":33,"curve":0,"color":"F8F8F8","cMask":["red","blue","ball"],"trait":"goalNet","pos":[-700,-80],"y":-80},{"v0":33,"v1":34,"color":"F8F8F8","cMask":["red","blue","ball"],"trait":"goalNet","x":-590},{"v0":34,"v1":35,"curve":0,"color":"F8F8F8","cMask":["red","blue","ball"],"trait":"goalNet","pos":[-700,80],"y":80},{"v0":36,"v1":37,"curve":94.0263701017,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":39,"v1":38,"curve":86.632306418889,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":40,"v1":41,"curve":-94.026370101699,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":37,"v1":41,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":43,"v1":42,"curve":-86.632306418888,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":45,"v1":44,"curve":86.632306418884,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":47,"v1":46,"curve":-86.632306418899,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":48,"v1":49,"curve":-94.026370101699,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":50,"v1":51,"curve":94.026370101699,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line"},{"v0":52,"v1":53,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":390},{"v0":55,"v1":54,"curve":-180.00692920292,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-375},{"v0":54,"v1":55,"curve":-180.00218240614,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-375},{"v0":57,"v1":56,"curve":-179.64823645332,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-375},{"v0":56,"v1":57,"curve":-180.35758668147,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-375},{"v0":59,"v1":58,"curve":-180.02357323962,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-375},{"v0":58,"v1":59,"curve":-180.00924102399,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-375},{"v0":61,"v1":60,"curve":-180.06885755885,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-375},{"v0":60,"v1":61,"curve":-180.02948353257,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-375},{"v0":63,"v1":62,"curve":-179.99869069543,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":375},{"v0":62,"v1":63,"curve":-179.99939258776,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":375},{"v0":65,"v1":64,"curve":-180.08826047163,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":375},{"v0":64,"v1":65,"curve":-179.91186753664,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":375},{"v0":67,"v1":66,"curve":-179.99528711105,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":375},{"v0":66,"v1":67,"curve":-179.99743836358,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":375},{"v0":69,"v1":68,"curve":-179.98626041101,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":375},{"v0":68,"v1":69,"curve":-179.99175181595,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":375},{"v0":71,"v1":70,"curve":-180.04715562398,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-277.5},{"v0":70,"v1":71,"curve":-179.95294709391,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-277.5},{"v0":73,"v1":72,"curve":-179.95715750564,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-277.5},{"v0":72,"v1":73,"curve":-179.89943871875,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-277.5},{"v0":75,"v1":74,"curve":-179.94773754738,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-277.5},{"v0":74,"v1":75,"curve":-179.98221351296,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-277.5},{"v0":77,"v1":76,"curve":-180.4151727218,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-277.5},{"v0":76,"v1":77,"curve":-179.58764458796,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-277.5},{"v0":79,"v1":78,"curve":-180.00086646359,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":277.5},{"v0":78,"v1":79,"curve":-180.01965986376,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":277.5},{"v0":81,"v1":80,"curve":-180.03532601389,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":277.5},{"v0":80,"v1":81,"curve":-179.99380079,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":277.5},{"v0":83,"v1":82,"curve":-180.0044468452,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":277.5},{"v0":82,"v1":83,"curve":-180.01386779847,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":277.5},{"v0":85,"v1":84,"curve":-180.05158287563,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":277.5},{"v0":84,"v1":85,"curve":-180.01212223878,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":277.5},{"v0":86,"v1":87,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-240},{"v0":88,"v1":89,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-120},{"v0":90,"v1":91,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":240},{"v0":92,"v1":93,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":120},{"v0":94,"v1":95,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-381},{"v0":96,"v1":97,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-240,"y":123},{"v0":98,"v1":99,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-240,"y":123},{"v0":100,"v1":101,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-240,"y":-123},{"v0":102,"v1":103,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-240,"y":-123},{"v0":104,"v1":105,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":-381},{"v0":106,"v1":107,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":381},{"v0":108,"v1":109,"curve":0,"vis":true,"color":"F8F8F8","bCoef":0.1,"trait":"line","x":381},{"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":110,"v1":111,"cMask":["ball"],"x":330},{"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":112,"v1":113,"cMask":["ball"],"x":-330},{"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":114,"v1":115,"cMask":["ball"],"x":-330},{"vis":false,"color":"FFFFFF","bCoef":1,"trait":"ballArea","v0":116,"v1":117,"cMask":["ball"],"x":330},{"vis":false,"color":"FFFFFF","bCoef":0,"trait":"ballArea","v0":118,"v1":119,"cMask":["ball"],"x":371},{"vis":false,"color":"FFFFFF","bCoef":0,"trait":"ballArea","v0":120,"v1":121,"cMask":["ball"],"x":371},{"vis":false,"color":"FFFFFF","bCoef":0,"trait":"ballArea","v0":122,"v1":123,"cMask":["ball"],"x":-371},{"vis":false,"color":"FFFFFF","bCoef":0,"trait":"ballArea","v0":124,"v1":125,"cMask":["ball"],"x":-371}],"goals":[{"p0":[-374.25,-62.053454903872],"p1":[-374.25,64.043361696331],"team":"red"},{"p0":[374.25,62],"p1":[374.25,-62],"team":"blue"}],"discs":[{"radius":3.9405255187564,"pos":[-368.53340356886,64.043361696331],"color":"6666CC","trait":"goalPost","y":80},{"radius":3.9405255187564,"pos":[-368.53340356886,-62.053454903872],"color":"6666CC","trait":"goalPost","y":-80,"x":-560},{"radius":3.9405255187564,"pos":[368.9681846993,-62.144998272018],"color":"6666CC","trait":"goalPost","y":80},{"radius":3.9405255187564,"pos":[368.09926357786,63.94882446641],"color":"6666CC","trait":"goalPost","y":-80,"x":-560},{"radius":3,"invMass":0,"pos":[-368,-171],"color":"FFCC00","bCoef":0.1,"trait":"line"},{"radius":3,"invMass":0,"pos":[-368,171],"color":"FFCC00","bCoef":0.1,"trait":"line"},{"radius":3,"invMass":0,"pos":[368,171],"color":"FFCC00","bCoef":0.1,"trait":"line"},{"radius":3,"invMass":0,"pos":[368,-171],"color":"FFCC00","bCoef":0.1,"trait":"line"}],"planes":[{"normal":[0,1],"dist":-171,"trait":"ballArea"},{"normal":[0,-1],"dist":-171,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.2,"cMask":["all"]},{"normal":[0,-1],"dist":-200,"bCoef":0.2,"cMask":["all"]},{"normal":[1,0],"dist":-420,"bCoef":0.2,"cMask":["all"]},{"normal":[-1,0],"dist":-420,"bCoef":0.2,"cMask":["all"]}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":1},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["all"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]},"line":{"vis":true,"bCoef":0,"cMask":[""]},"arco":{"radius":2,"cMask":["n\/d"],"color":"cccccc"}},"playerPhysics":{"acceleration":0.11,"kickingAcceleration":0.083,"kickStrength":5,"bCoef":0},"ballPhysics":{"radius":6.25,"color":"FFCC00","bCoef":0.4,"invMass":1.5,"damping":0.99}}
		`
