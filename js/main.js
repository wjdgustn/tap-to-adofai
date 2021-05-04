window.AudioContext = window.AudioContext || window.webkitAudioContext;

window.onload = () => {
    let file_set = false;
    let filename;
    let player;
    let newstart = true;
    let doing = false;
    let mesure_started = false;
    let times = [];

    document.onkeypress = () => {
        if(!doing) return;
        if(!mesure_started) {
            if(newstart) {
                newstart = false;
                document.getElementById('reset_level').disabled = false;
                document.getElementById('musicoffset').disabled = true;
            }
            mesure_started = true;
            player.play();
        }

        const time = (player.currentTime * 1000) - Number(document.getElementById('musicoffset').value || 0);
        addlog(`새로운 박자 지점: ${time}ms`);

        times.push(time);
    }

    document.getElementById('music').onchange = function(e) {
        file_set = this.files[0] ? true : false;
        if(!file_set) return;

        const music = this.files[0];
        const url = URL.createObjectURL(music);

        if(player != null) player.pause();

        player = new Audio();
        player.src = url;

        filename = music.name;

        document.getElementById('reset_level').click();
    }

    document.getElementById('toggle_start').onclick = function() {
        if(!file_set) return addlog('음악이 선택되어야 합니다!');

        doing = !doing;
        this.innerText = `측정 ${!doing ? '시작' : '일시정지'}`;

        if(newstart) {
            player.currentTime = Number(document.getElementById('musicoffset').value / 1000) || 0;
            addlog('아무 키나 눌러 측정을 시작하세요.');
        }
        if(!newstart && doing) {
            addlog('아무 키나 눌러 측정을 다시 시작하세요.');
            document.getElementById('download_level').disabled = true;
        }

        if(!doing) {
            mesure_started = false;
            player.pause();
            if(!newstart) document.getElementById('download_level').disabled = false;
        }
    }

    document.getElementById('reset_level').onclick = function() {
        newstart = true;
        doing = false;
        mesure_started = false;
        player.pause();
        times = [];
        document.getElementById('toggle_start').innerText = `측정 시작`;
        document.getElementById('log').innerText = '';

        this.disabled = true;
        document.getElementById('download_level').disabled = true;
        document.getElementById('musicoffset').disabled = false;
    }

    document.getElementById('download_level').onclick = async function() {
        const edittimes = times.slice(1);
        const adofai = (await axios.get('assets/template.adofai')).data;

        adofai.pathData = 'R'.repeat(edittimes.length);
        adofai.settings.songFilename = filename;

        let beforems = 0;
        for(let t in edittimes) {
            adofai.actions.push({ "floor": Number(t) + 1, "eventType": "SetSpeed", "speedType": "Bpm", "beatsPerMinute": 60000 / (edittimes[t] - beforems), "bpmMultiplier": 1 });
            beforems = edittimes[t];
        }

        download('export.adofai', JSON.stringify(adofai));
    }
}

function download(filename, text) {
    const element = document.createElement('a');
    element.href = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
    element.download = filename;
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    element.remove();
}

function addlog(addstring) {
    document.getElementById('log').innerHTML = addstring + '\n' + document.getElementById('log').value;
}