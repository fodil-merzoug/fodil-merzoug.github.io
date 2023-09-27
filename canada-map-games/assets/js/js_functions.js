document.addEventListener("DOMContentLoaded", function(event) {
  screen_width = window.innerWidth;
  (screen_width>=1024) ? mode_affichage = 0 : mode_affichage = 1;
    
  //initialize DOM elements
  initDomElements();

  // Get choosen language
  var currentURL = window.location.href;
  var url = new URL(currentURL);
  var params = new URLSearchParams(url.search);
  var language = params.get('lng');
  if(language!="en") language = "fr";

  initTranslation(language);

  //--------------------- Leaflet map -----------------
  //Map1 (large screen)
  var map1 = L.map('map',{zoomSnap: 0.5});
  
  map1.fitBounds([
      //[85.858637, -78.384946],[35.693714, -58.989869]
      //[84.530619, -98.788865],[35.693714, -58.989869]
      [83.463219, -177.247191],[35.693714, -58.989869]
  ]);
  map1.setMaxBounds(map1.getBounds());
  
  L.tileLayer(/*'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}', {
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png',*/
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    minZoom: 3,
    maxZoom: 4,
  }).addTo(map1);
  
  //Map2 (medium & small screen)
  var map2 = L.map('map2',{zoomSnap: 0.25});
  map2.fitBounds([
    [83.463219, -177.247191],[35.693714, -58.989869]
  ]);
  map2.setMaxBounds(map2.getBounds());

  L.tileLayer(/*'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.{ext}', {
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png',*/
    'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    minZoom: 2,
    maxZoom: 4,
  }).addTo(map2);

  //Init MyMaps
  MyMaps = [map1,map2];
  selected_map = MyMaps[mode_affichage];

  //--------------------- Init vars -----------------      
  var geoJSON_country;
  var geoJSON_provinces = [];
  
  var comptearebours;
  var textviews_nbr_provinces_trouves = [...document.getElementsByClassName("textview-nbr-provinces-trouves")];
  var nbr_provinces_trouves = 0;
  
  let game_time = 120; 
  var remaining_time = game_time;
  var textviews_timer = [...document.getElementsByClassName("textview-timer")];

  
  //init geoJSON files
  init_geoJSON_coordinates_country();
  init_geoJSON_coordinates_provinces();
  //---------------------------------------------------


  //--------------------- Functions -----------------
  function initDomElements(){
    textviews_saisir_province = [...document.getElementsByClassName("textview-saisir-province")];
    inputs_provinces = [...document.getElementsByClassName("input-provinces")];  
    btn_show_provinces = [...document.getElementsByClassName("btn-show-provinces")][0];
    textviews_liste_provinces = [...document.getElementsByClassName("textview-liste-provinces")];
    THs_tableau_provinces = [...document.getElementsByClassName("th-province")];
    divs_replay = [...document.getElementsByClassName("div-replay")];
  }

  function initTranslation(lng){
    fetch('./assets/json/translations/'+lng+'.json')
    .then(response => response.text())
    .then((data) => {
      var translationData = JSON.parse(data);
      
      titre_swal_chargement = translationData.titre_toast_chargement;
      txt_swal_chargement = translationData.txt_toast_chargement;

      titre_swal_accueil = translationData.titre_toast_accueil;
      txt_swal_accueil = translationData.txt_toast_accueil;
      btn_swal_accueil = translationData.btn_toast_accueil;

      textviews_saisir_province.forEach(element => {element.innerHTML = translationData.txt_saisir_province;});
      inputs_provinces.forEach(element => {element.placeholder = translationData.hint_input_province;});
      btn_show_provinces.innerHTML = "<i class='fa-solid fa-arrow-down'></i> "+translationData.btn_show_provinces+" <i class='fa-solid fa-arrow-down'></i>";
      
      textviews_liste_provinces.forEach(element => {element.innerHTML = translationData.titre_liste_provinces;});
      THs_tableau_provinces.forEach(element => {element.innerHTML = translationData.txt_tableau_provinces;});
      
      liste_provinces_display = translationData.liste_provinces_display;
      liste_provinces = translationData.liste_provinces;
      nbr_provinces = liste_provinces.length-1;

      TDs_elements = [null];
      TDs_elements2 = [null];
      for (i=1; i<=nbr_provinces; i++) {
        TDs_elements.push(document.getElementById("td"+i));
        TDs_elements2.push(document.getElementById("td"+i+"_2"));
      }
      MyTDs = [TDs_elements,TDs_elements2];
      selected_TDs = MyTDs[mode_affichage];

      titre_swal_fin = translationData.titre_toast_fin;
      score_swal_fin = translationData.score_toast_fin;
      temps_swal_fin = translationData.temps_toast_fin;
      btn_swal_fin = translationData.btn_toast_fin;

      txt_btn_replay = translationData.btn_replay;

      startLoading();
    });
  }

  function startLoading(){
    loading_level = 0;
    Swal.fire({
      title: titre_swal_chargement,
      html: txt_swal_chargement,
      
      allowOutsideClick: false,
      allowEscapeKey: false,
      preConfirm: () => {
          return false;
      },
      preDeny: () => {
          return false;
      },
      
      didOpen: () => {
          Swal.showLoading()
          const b = Swal.getHtmlContainer().querySelector('b')
          timerInterval = setInterval(() => {
            if(language=="ar") b.textContent = "%"+loading_level;
            else b.textContent = loading_level+"%";
          }, 200)
      },
      willClose: () => {
          clearInterval(timerInterval)
      }
    });
  }

  function init_geoJSON_coordinates_country(){
    fetch('./assets/json/geoJSON_coordinates/Canada.geojson')
    .then(response => response.text())
    .then((data) => {
      geoJSON_country = JSON.parse(data);
    })
  }

  function drawCountryBorders(){
    var CountryBordersStyle = {
      //"color": "#5bb304",
      "weight": 1.2,
      "fillColor": "#ffffff",
      "fillOpacity": 0.1,
    };
    
    //var CountryBorders = L.geoJSON(geoJSON_country,{style: CountryBordersStyle}).addTo(map);
    MyMaps.forEach(map => {
      L.geoJSON(geoJSON_country,{style: CountryBordersStyle}).addTo(map);
    });

    //Manually Draw provinces borders (not visible with low zoom)
    initialProvinceBordersStyle = {"fillColor": "#ffffff","color": "#888888","weight": 0.2};
    for(var p=1;p<=geoJSON_provinces.length;p++)
      L.geoJSON(geoJSON_provinces[p],{style: initialProvinceBordersStyle}).addTo(selected_map);
  }

  function init_geoJSON_coordinates_provinces(i=1){
    if(i<10) wilaya = "0"+i;
    else     wilaya = ""+i;
    fetch('./assets/json/geoJSON_coordinates/'+wilaya+'.geojson')
    .then(response => response.text())
    .then((data) => {
      geoJSON_provinces[i] = JSON.parse(data);
      loading_level = parseInt(100*i/nbr_provinces);
      if(i<nbr_provinces) init_geoJSON_coordinates_provinces(i+1);
      else getReadyToStartGame(); //End of loading
    })
  }

  function drawWilayaBorders(id_province,nom_province,unfound=false){
    WilayaBordersStyle = {"color": "#3388FF","weight": 1.1,}; //WilayaBordersStyle = {"color": "#5bb304","weight": 1.1,};
    if(unfound) WilayaBordersStyle = {"color": "#a3342c","weight": 1.0,};

    //if(selected_index){
      /*selected_map = MyMaps[selected_mode];
      selected_TDs = MyTDs[selected_mode];*/
      
      var wilayaBorders = L.geoJSON(geoJSON_provinces[id_province],{style: WilayaBordersStyle}).addTo(selected_map);

      //Initialiser le popup à sa création (Afficher puis masquer), pour pouvoir l'activer on mouseover plus tard
      var wilayaPopup = L.popup({offset: [0, 0]}).setContent(nom_province);
      wilayaBorders.bindPopup(wilayaPopup).openPopup();
      selected_map.closePopup();

      //Popup events on map
      wilayaBorders.on('mouseover', function(){selected_map.openPopup(wilayaPopup)});
      wilayaBorders.on('mouseout', function(){selected_map.closePopup()});

      //Popup events on list
      td_element = selected_TDs[id_province]; //document.getElementById("td"+id_province);          
      td_element.onmouseover = function(){selected_map.openPopup(wilayaPopup)};
      td_element.onmouseout = function(){selected_map.closePopup()};
    /*}
    else{
      MyMaps.forEach(map => {
        var wilayaBorders = L.geoJSON(geoJSON_provinces[id_province],{style: WilayaBordersStyle}).addTo(map);
  
        //Initialiser le popup à sa création (Afficher puis masquer), pour pouvoir l'activer on mouseover plus tard
        var wilayaPopup = L.popup({offset: [0, 0]}).setContent(nom_province);
        wilayaBorders.bindPopup(wilayaPopup).openPopup();
        map.closePopup();
  
        //Popup events on map
        wilayaBorders.on('mouseover', function(){map.openPopup(wilayaPopup)});
        wilayaBorders.on('mouseout', function(){map.closePopup()});
  
        //Popup events on list
        td_element = TDs_elements[id_province]; //document.getElementById("td"+id_province);          
        td_element.onmouseover = function(){map.openPopup(wilayaPopup)};
        td_element.onmouseout = function(){map.closePopup()};

        td_element = TDs_elements2[id_province]; //document.getElementById("td"+id_province);          
        td_element.onmouseover = function(){map.openPopup(wilayaPopup)};
        td_element.onmouseout = function(){map.closePopup()};
      });
    }*/
  }

  function getReadyToStartGame(){
    if(language=="ar") inputs_provinces.forEach(element => {element.style.textAlign = "right";}); 

    //Display div_main
    document.getElementById('div_main').style.visibility = "visible";
    
    //Draw Country borders
    drawCountryBorders();

    //Start game message
    Swal.fire({
      title: titre_swal_accueil,
      html: txt_swal_accueil,
      confirmButtonText: btn_swal_accueil,
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      startGame();
    });
    
  }

  function startGame(){
    //Init span nbr_provinces_trouves 
    textviews_nbr_provinces_trouves.forEach(element => {element.innerHTML = nbr_provinces_trouves+" / "+nbr_provinces;});   

    //Init span timer 
    textviews_timer.forEach(element => {element.innerHTML = displayFormattedTime(remaining_time);});

    //Start timer
    comptearebours = setInterval(updateTimer, 1000);
    
    //Handle input_provinces 
    inputs_provinces.forEach(element => {
      element.onkeyup = function() {checkEnteredValue(element.value)}; //Add onkeyup listener
    });
    //Set focus
    selected_input = inputs_provinces[mode_affichage];
    selected_input.focus();
  }

  function toLowerCaseWithoutAccents(text){
    //(language=="ar") ? result = text : result = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    result = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    result = result.trim();
    
    //Handle wilaya names variants
    if((language=="fr")){
      if(["colombie britannique","colombie-britanique","colombie britanique"].includes(result)) result = "colombie-britannique";
      else if(["nouveau brunswick","nouveau-brunswik","nouveau brunswik","nouveau bronswick","nouveau-bronswik","nouveau bronswik"].includes(result)) result = "nouveau-brunswick";
      else if(["terre neuve et labrador","terre-neuve et labrador","terres neuves et labrador","terres-neuves-et-labrador"].includes(result)) result = "terre-neuve-et-labrador";
      else if(["territoires du nord ouest","territoires-du-nord-ouest","territoire du nord ouest","territoire-du-nord-ouest","nord-ouest","nord ouest"].includes(result)) result = "territoires du nord-ouest";   
      else if(["nouvelle ecosse"].includes(result)) result = "nouvelle-ecosse";
      else if(["ile du prince edouard","ile du prince-edouard","iles du prince edouard","iles du prince-edouard","ile du prince edward","ile du prince-edward","iles du prince edward","iles du prince-edward"].includes(result)) result = "ile-du-prince-edouard";
      else if(["saskatchwan"].includes(result)) result = "saskatchewan";  
    }
    else{
      if(["british colombia"].includes(result)) result = "british columbia";
      else if(["new brunswik","new bronswick","new bronswik"].includes(result)) result = "new brunswick";
      else if(["new foundland and labrador","new found land and labrador"].includes(result)) result = "newfoundland and labrador";
      else if(["north west territories","northwest territory","north west territory"].includes(result)) result = "northwest territories";   
      else if(["prince edouard island"].includes(result)) result = "prince edward island";
      else if(["saskatchwan"].includes(result)) result = "saskatchewan";
    }

    return result;
  }

  function checkEnteredValue(v){
    if(v!=""){
      valueToCheck = toLowerCaseWithoutAccents(v);
      if(liste_provinces.includes(valueToCheck)){
          num_province = liste_provinces.indexOf(valueToCheck);
          nom_province = liste_provinces_display[num_province];

          td_element = selected_TDs[num_province];//document.getElementById("td"+num_province);
          td_element.classList.add("found-province");
          td_element.innerHTML = nom_province;

          liste_provinces[num_province] = "";
          drawWilayaBorders(num_province,nom_province);
          nbr_provinces_trouves++;
          textviews_nbr_provinces_trouves.forEach(element => {element.innerHTML = nbr_provinces_trouves+" / "+nbr_provinces;});
          inputs_provinces.forEach(element => {element.value = "";});

          if(nbr_provinces_trouves==nbr_provinces) endGame();
      }
    }
  }

  function displayFormattedTime(s){
    let mn = parseInt(s/60);
    let sc = s%60;
    if(sc<10) sc = "0"+sc;
    return mn+":"+sc;
  }

  function updateTimer() {
      remaining_time--;
      textviews_timer.forEach(element => {element.innerHTML = displayFormattedTime(remaining_time);});
      if(remaining_time==0) endGame();
  }

  function endGame(){
    clearInterval(comptearebours);
    inputs_provinces.forEach(element => {element.remove();});
    textviews_timer.forEach(element => {element.remove();});

    if(language=="ar"){
      txt_provinces_trouvees = nbr_provinces+"/"+nbr_provinces_trouves;
      txt_btn_replay = "<a class='btn btn-success' href='game1.html?lng="+language+"' role='button'>"+txt_btn_replay+" <i class='fa-solid fa-rotate-right'></i></a>";
    }
    else{
      txt_provinces_trouvees = nbr_provinces_trouves+"/"+nbr_provinces;
      txt_btn_replay = "<a class='btn btn-success' href='game1.html?lng="+language+"' role='button'><i class='fa-solid fa-rotate-right'></i> "+txt_btn_replay+"</a>";
    }

    end_game_message = "&#x1F3AF "+score_swal_fin+txt_provinces_trouvees;
    if(remaining_time>0){
      time_spent = game_time - remaining_time;
      end_game_message += "<br><br>&#x231A "+temps_swal_fin+displayFormattedTime(time_spent);
    }
    else if(nbr_provinces_trouves<nbr_provinces){
      showUnfoundWilayas();
    }
    
    divs_replay.forEach(element => {element.innerHTML = txt_btn_replay;});

    Swal.fire({
      title: titre_swal_fin,
      html: end_game_message, 
      confirmButtonText: btn_swal_fin,     
    });
  }

  function showUnfoundWilayas(){
    liste_provinces.forEach((element, index) => {
      if (element !== "") {
        num_province = index;
        nom_province = liste_provinces_display[num_province];
        drawWilayaBorders(num_province,nom_province,true);

        td_element = selected_TDs[num_province];//document.getElementById("td"+num_province);
        td_element.classList.add("unfound-province");
        td_element.innerHTML = nom_province;
      }
    });
  }
  //-------------------------------------------------

});
