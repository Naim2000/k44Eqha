module.exports = function(channel, client, maxNoteLength = 3000){

    if (!client) {
        client = new (require('./Client.js'))('ws://www.multiplayerpiano.com:443');
        client.setChannel(channel || "lobby");
        client.start();
    }

    var Midi = require('./jsmidgen.js');

    function key2number(note_name) {
        var MIDI_KEY_NAMES = ["a-1","as-1","b-1","c0","cs0","d0","ds0","e0","f0","fs0","g0","gs0","a0","as0","b0","c1","cs1","d1","ds1","e1","f1","fs1","g1","gs1","a1","as1","b1","c2","cs2","d2","ds2","e2","f2","fs2","g2","gs2","a2","as2","b2","c3","cs3","d3","ds3","e3","f3","fs3","g3","gs3","a3","as3","b3","c4","cs4","d4","ds4","e4","f4","fs4","g4","gs4","a4","as4","b4","c5","cs5","d5","ds5","e5","f5","fs5","g5","gs5","a5","as5","b5","c6","cs6","d6","ds6","e6","f6","fs6","g6","gs6","a6","as6","b6","c7"];
        var MIDI_TRANSPOSE = -12;
        var note_number = MIDI_KEY_NAMES.indexOf(note_name);
        if (note_number == -1) return;
        note_number = note_number + 9 - MIDI_TRANSPOSE;
        return note_number;
    }


    var midiFile = new Midi.File();
    var startTime = Date.now();
    var players = {};
    function addPlayer(participant) {
        players[participant._id] = {
            track: midiFile.addTrack(),
            lastNoteTime: startTime,
            keys: {}
        }
        var track_name = `${participant.name} ${participant._id}`;
        players[participant._id].track.addEvent(new Midi.MetaEvent({type: Midi.MetaEvent.TRACK_NAME, data: track_name }));
    }

    function addNote(note_name, vel, participant, isStopNote) {
        if (!players.hasOwnProperty([participant._id])) addPlayer(participant);
        var player = players[participant._id];
        if (!player.keys.hasOwnProperty(note_name)) player.keys[note_name] = {};
        var playerkey = player.keys[note_name];
        
        var note_number = key2number(note_name);
        if (!note_number) return;
        
        var time_ms = Date.now() - player.lastNoteTime;
        var time_ticks = time_ms * 0.256; // 0.256 ticks per millisecond, based on 128 ticks per beat and 120 beats per minute
        var midiVel = vel * 127;
        
        //player.track[isStopNote ? 'addNoteOff' : 'addNoteOn'](0, note_number, time_ticks, midiVel); // easy way
        // but we need to maintain proper on/off order and limit note lengths for it to (dis)play properly in all midi players etc
        if (isStopNote) {
            if (!playerkey.isPressed) return;
            player.track.addNoteOff(0, note_number, time_ticks, midiVel);
            playerkey.isPressed = false;
            clearTimeout(playerkey.timeout);
        } else {
            if (playerkey.isPressed) {
                player.track.addNoteOff(0, note_number, time_ticks, midiVel);
                player.track.addNoteOn(0, note_number, 0, midiVel);
                clearTimeout(playerkey.timeout);
            } else {
                player.track.addNoteOn(0, note_number, time_ticks, midiVel);
            }
            playerkey.isPressed = true;
            playerkey.timeout = setTimeout(addNote, maxNoteLength, note_name, vel, participant, true);
        }
        
        player.lastNoteTime = Date.now();
    }


    function save(){
        var file = midiFile.toBytes();
        midiFile = new Midi.File();
		players = {};
        startTime = Date.now();
        return file;
    }



    client.on("n", function (msg) {
        var DEFAULT_VELOCITY = 0.5;
        var TIMING_TARGET = 1000;
        var t = msg.t - client.serverTimeOffset + TIMING_TARGET - Date.now();
        var participant = client.findParticipantById(msg.p);
        msg.n.forEach(note => {
            var ms = t + (note.d || 0);
            if (ms < 0) ms = 0; else if (ms > 10000) return;
            if (note.s) {
                setTimeout(addNote, ms, note.n, undefined, participant, true);
            } else {
                var vel = parseFloat(note.v) || DEFAULT_VELOCITY;
                if (vel < 0) vel = 0; else if (vel > 1) vel = 1;
                setTimeout(addNote, ms, note.n, vel, participant, false);
            }
        });
    });


    return {client, save, startTime};
}