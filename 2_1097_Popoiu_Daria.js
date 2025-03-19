"use strict";

var drgItem;
var currentId;
var effect="normal";
var isPinkActive=false;
var isCinematic=false;
var requestId;
var isCaptions=false;

const app={
    video:null,
    playButton:null,
    backButton:null,
    forwardButton:null,
    SecFrontBtn:null,
    SecBackBtn:null,
    playlist:[],
    currentUrl:'',
    sliderTime:null,
    videoDurationLabel:null,
    currentTimeLabel:null,
    volumeButton:null,
    sliderVolume:null,
    subtitles:null
}

app.createCanvas=function(canvas,videoContainer){
    canvas.width = videoContainer.clientWidth; 
    canvas.height = videoContainer.clientHeight; 
}

app.draw=function(canvas,video,context){
    context.drawImage(video,0,0,canvas.width,canvas.height);

    requestAnimationFrame(() => app.draw(canvas, video, context));
}

app.play=function(url){

    const elements=document.querySelectorAll('[data-url]');
    for(let i=0;i<elements.length;i++){
        elements[i].classList.remove("active");
    }

    const currentElement = document.querySelector("[data-url = '"+url+"'")
    if(currentElement){
        currentElement.classList.add("active");
        currentId=currentElement.dataset.id;
    }

    app.video.src = url;
    app.currentUrl = url;

    app.video.play();

};

app.secondsToMinutes = function(seconds){
    const min = Math.floor(seconds/60);
    const sec = Math.floor(seconds%60);

    let second;
    if(sec < 10 ){
        second = "0" + sec;
    }
    else{
        second = sec;
    }
    return min+":"+second;

}

app.isBefore=function(a,b){

    if(a.parentNode===b.parentNode){
        var el=a.previousSibling;
        while(el!==null){
            if(el===b){
                return true;
            }
            el=el.previousSibling;
        }
        return false;
    }

}

app.updatePlaylist=function(){
    var currentPlaylist=document.querySelectorAll(".playlist .list-group-item");

    app.playlist=[];
    for(let i=0;i<currentPlaylist.length;i++){
        app.playlist.push(currentPlaylist[i].dataset.url);
    }

    currentPlaylist.forEach(function(item){
        let thumbnail=item.getElementsByClassName(".thumbnail")[0];
        let id=item.dataset.id;
        if(thumbnail && id){
            thumbnail.src="/media/thumbnails/"+id+".png";
        }
    });

    localStorage.setItem('playlist', JSON.stringify(app.playlist));
    console.log(app.playlist);
}

app.nextVideo=function(){
    if(app.playlist.length===0){
        app.play("/media/no-signal.mp4");
        return ;
    }

    let index=app.playlist.indexOf(app.currentUrl);
    index++;

    if(index>app.playlist.length-1)
    {
        index=0;
    }
    app.play(app.playlist[index]);
}

app.setEvents=function(){
    var currentPlaylist=document.querySelectorAll(".playlist .list-group-item");

    currentPlaylist.forEach(function(item){

        item.addEventListener("click",function(){
            const url = item.dataset.url;
            app.play(url);
        });

        item.addEventListener('dragstart', function(){
            drgItem = item; 
            drgItem.style.opacity = 0.5;       
        }); 

        item.addEventListener('dragover', function(){
            if (drgItem !== item) {
                if (app.isBefore(drgItem,item)) {
                   item.parentNode.insertBefore(drgItem, item);
                } else {
                    item.parentNode.insertBefore(drgItem, item.nextSibling);
                }
            }
        });    

        item.addEventListener('dragend', function(){
            item.style.opacity = 1;
            app.updatePlaylist();
        });    
    });
}

app.secondToHour=function(seconds){
    const hour = Math.floor(seconds / 3600); 
    const min = Math.floor((seconds % 3600) / 60); 
    const sec = Math.floor(seconds % 60); 

    let second,minute,hourF;
    if (sec < 10) {
        second = "0" + sec;
    } else {
        second = sec;
    }

    if (min < 10) {
        minute = "0" + min;
    } else {
        minute = min;
    }

    if (hour < 10) {
        hourF = "0" + hour;
    } else {
        hourF = hour;
    }
    return hourF+":"+minute+":"+second;
}

app.showSubtitles=function(id) {
    fetch('/media/captions/'+id+'.json') 
        .then(response => response.json())
        .then(data => {
            if (data) {
                isCaptions=true;
                const subtitlesArray = data.subtitles;

                const currTime=app.secondToHour(app.video.currentTime);

                app.subtitles.innerHTML = '';

                subtitlesArray.forEach(subt=>{
                   if(subt.start<=currTime && subt.end>=currTime)
                        app.subtitles.innerHTML=subt.text;
                });
            }
        })
        .catch(error =>{
            isCaptions=false;
            console.error('Eroare la încărcarea fisierului JSON:', error)
        });
}

app.getSavedSetting=function(){
    const savedVolume = localStorage.getItem('playervolume');

    if (savedVolume !== null) {
        app.video.volume = savedVolume;
        volumeSlider.value = savedVolume * 100;
    }
}

app.updateCanvas=function(context,videoContainer,canvas){

    // console.log("update Canvas");

    canvas.width = videoContainer.clientWidth; 
    canvas.height = videoContainer.clientHeight; 

    context.drawImage(video,0,0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch(effect){
        case "normal":
            break;
        case "pink":
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];       
                const g = data[i + 1];   
                const b = data[i + 2]; 

                data[i] = r * 1.5;           
                data[i + 1] = g * 0.5;  
                data[i + 2] = b * 1.5;   
            }
            break;
        case "cinematic":
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];       
                const g = data[i + 1];   
                const b = data[i + 2]; 

                data[i] = r * 0.5;           
                data[i + 1] = g * 1.5;  
                data[i + 2] = b * 1.5; 
                
                data[i] = Math.max(0, data[i] - 50);       
                data[i + 1] = Math.max(0, data[i + 1] - 50); 
                data[i + 2] = Math.max(0, data[i + 2] - 50); 
            }
            break;
    }

    context.putImageData(imageData, 0, 0);

    requestAnimationFrame(function(){
        app.updateCanvas(context, video, canvas);}
    );
}

app.load=function(){

    const video=document.getElementById("video");
    const videoContainer=document.getElementById("videoContainer");
    const canvas=document.getElementById("videoCanvas");
    const playButton=document.getElementById("PlayButton");
    const backButton=document.getElementById("BackwardButton");
    const forwardButton=document.getElementById("ForwardButton");
    const SecFrontBtn=document.getElementById("15SecFrontBtn");
    const SecBackBtn=document.getElementById("15SecBackBtn");
    const sliderTime=document.getElementById("timeSlider");
    const videoDurationLabel=document.getElementById("duration");
    const currentTimeLabel=document.getElementById("currentTime");
    const volumeButton=document.getElementById("VolumeButton");
    const videoTitle = document.getElementById("videoTitle");
    const sliderVolume=document.getElementById("volumeSlider");
    const playlistItem = document.querySelectorAll(".playlist .list-group-item")
    const playlistContainer = document.querySelector(".playlist");
    const addVideoArea=document.getElementById("addVideoArea");
    const removeVideoArea=document.getElementById("removeVideoArea");
    const browseBtn=document.getElementById("browseFilesBtn");
    const fileInput=document.getElementById("fileInput");
    const subtitleBtn=document.getElementById("subtitlesButton");
    const previewContainer=document.getElementById("previewContainer");
    const previewImg=document.getElementById("previewImg");
    app.subtitles=document.getElementById("subtitleDisplay");
    const pinkFilter=document.getElementById("pinkFilter");
    const cinematicFilter=document.getElementById("cinematicFilter");

    const context=canvas.getContext("2d");

    const elements = document.querySelectorAll('[data-url]');

    app.video=video;

    for(let i=0; i<elements.length;i++){
        const url = elements[i].dataset.url;
        app.playlist.push(url);
        elements[i].addEventListener("click", function(){
            app.play(url);
        })
    }

    app.getSavedSetting();

    app.currentUrl=app.playlist[0];
    currentId=1;
    
    app.video.addEventListener('loadeddata',function(){
        app.createCanvas(canvas,videoContainer);
        app.draw(canvas,video,context);

        // console.log(context);

        sliderTime.min = 0; 
        sliderTime.max = video.duration;
        videoDurationLabel.innerText = app.secondsToMinutes(video.duration);
        volumeSlider.value = video.volume * 100;

        setInterval(() => {
            app.showSubtitles(currentId); 
        }, 500);
    });

    app.video.addEventListener('timeupdate', function () {
        sliderTime.value = video.currentTime;
        currentTimeLabel.innerText = app.secondsToMinutes(video.currentTime);
    });

    pinkFilter.addEventListener("click",function(){
        // console.log(effect);
        if(isPinkActive===false)
        {
            effect="pink";
            isPinkActive=true;
            pinkFilter.style.backgroundColor="black";
        }
        else{
            effect="normal";
            isPinkActive=false;
            pinkFilter.style.backgroundColor="rgb(39, 38, 38)";
        }
        app.updateCanvas(context,videoContainer,canvas);   
    });

    sliderTime.addEventListener('input', function () {
        video.currentTime = sliderTime.value;
    });

    cinematicFilter.addEventListener("click",function(){
        if(isCinematic===false)
            {
                effect="cinematic";
                isCinematic=true;
                cinematicFilter.style.backgroundColor="black";
            }
            else{
                effect="normal";
                isCinematic=false;
                cinematicFilter.style.backgroundColor="rgb(39, 38, 38)";
            }
            app.updateCanvas(context,video,canvas);
    });

    sliderTime.addEventListener("mousemove",function(ev){
        const sliderValue = sliderTime.value; 
        const duration = video.duration;
       
        const currentTime = (sliderValue / 100) * duration;

        console.log(currentTime);

        const frameIndex = Math.ceil(currentTime);

        previewImg.src="/media/previews/"+currentId+"/preview"+frameIndex+".jpg";

        const sliderRect = sliderTime.getBoundingClientRect();
        const thumbPosition = ev.clientX - sliderRect.left; 

        previewContainer.style.left = (thumbPosition-50)+"px"
    
        previewContainer.style.display="block";
    });

    sliderTime.addEventListener("mouseleave",function(){
        previewContainer.style.display="none";
    });

    sliderVolume.addEventListener('input',function(){
        const volume = sliderVolume.value / 100;
        app.video.volume = volume;

        localStorage.setItem('playervolume',volume);

        if (volume === 0) {
            app.video.muted = true;
            volumeButton.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
        } else {
            app.video.muted = false;
            volumeButton.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
        } 
    });

    volumeButton.addEventListener("click",function(){
        if (app.video.muted) {
            app.video.muted = false;
            volumeButton.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
        } else {
            app.video.muted = true;
            volumeButton.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
        }
    });
    
    playButton.addEventListener("click",function(){
        if(video.paused){
            video.play();
            playButton.innerHTML='<i class="bi bi-pause-fill"></i>';
        }else{
            video.pause();
            playButton.innerHTML='<i class="bi bi-play-fill"></i>';
        }   
    });

    backButton.addEventListener("click",function(){
        let index=app.playlist.indexOf(app.currentUrl);
        index--;
        if(index<0)
        {
            index=app.playlist.length-1;
        }

        app.play(app.playlist[index]);
    });

    forwardButton.addEventListener("click",function(){
        let index=app.playlist.indexOf(app.currentUrl);
        index++;
        if(index>app.playlist.length-1)
        {
            index=0;
        }

        app.play(app.playlist[index]);
    });

    video.addEventListener('ended',function(){
        let index=app.playlist.indexOf(app.currentUrl);
        index++;
        if(index>=app.playlist.length)
        {
            index=0;
        }

        app.play(app.playlist[index]);
    });
    
    SecFrontBtn.addEventListener("click",function(){
        app.video.currentTime += 15;
    });

    SecBackBtn.addEventListener("click",function(){
        app.video.currentTime-=15;
    });

    subtitleBtn.addEventListener("click",function(){
        if (app.subtitles.style.visibility === "visible") {
            app.subtitles.style.visibility = "hidden";
        } else {
            app.subtitles.style.visibility = "visible";
        }
    });

    playlistItem.forEach(function(item) {
        item.addEventListener('dragstart', function(){
            drgItem = item; 
            drgItem.style.opacity = 0.5;       
        }); 

        item.addEventListener('dragover', function(){
            if (drgItem !== item) {
                if (app.isBefore(drgItem,item)) {
                   item.parentNode.insertBefore(drgItem, item);
                } else {
                    item.parentNode.insertBefore(drgItem, item.nextSibling);
                }
            }
        });    

        item.addEventListener('dragend', function(){
            item.style.opacity = 1;
            app.updatePlaylist();
        });   

      });

    removeVideoArea.addEventListener('dragover',function(ev){
        ev.preventDefault();
        removeVideoArea.style.backgroundColor="aquamarine"; 
    });

    removeVideoArea.addEventListener('dragleave',function(){
        removeVideoArea.style.backgroundColor="white";
    });

    removeVideoArea.addEventListener('drop',function(){
        removeVideoArea.style.backgroundColor="white";

        if(drgItem!==null){
            drgItem.remove();
            app.updatePlaylist();
            app.nextVideo();
        }
    });

    addVideoArea.addEventListener('dragover',function(ev){
        ev.preventDefault();
        addVideoArea.style.backgroundColor="aquamarine"; 
        
    });

    addVideoArea.addEventListener('dragleave',function(){
        addVideoArea.style.backgroundColor="white";
    });

    addVideoArea.addEventListener('drop',function(ev){
        ev.preventDefault();

        addVideoArea.style.backgroundColor="white";

        const file=ev.dataTransfer.files[0];
        const url=URL.createObjectURL(file);

        const listItem = document.createElement("li");
        listItem.className = "list-group-item";
        listItem.dataset.url = url; 
        listItem.draggable = true;
        listItem.innerHTML = `
        <img src="media/thumbnails/default.jpg" alt="new-video" class="thumbnail">
        ${file.name}
        <i class="bi bi-grip-horizontal drag-icon"></i>`;
        listItem.dataset.id=app.playlist.length+1;

        playlistContainer.appendChild(listItem);

        app.setEvents();

        app.updatePlaylist();
    });

    browseBtn.addEventListener("click",function(){
        fileInput.click();
    });

    fileInput.addEventListener("change",function(){
        const file=fileInput.files[0];
        const url=URL.createObjectURL(file);

        const listItem = document.createElement("li");
        listItem.className = "list-group-item";
        listItem.dataset.url = url; 
        listItem.draggable = true;
        listItem.innerHTML = `
        <img src="media/thumbnails/default.jpg" alt="new-video" class="thumbnail">
        ${file.name}
        <i class="bi bi-grip-horizontal drag-icon"></i>`;
        listItem.dataset.id=app.playlist.length+1;

        playlistContainer.appendChild(listItem);

        app.setEvents();

        app.updatePlaylist();

    });

};
