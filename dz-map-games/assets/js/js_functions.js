document.addEventListener("DOMContentLoaded", function(event) {

  //initialize DOM elements
  initDomElements();

  // Get choosen language
  var currentURL = window.location.href;
  var url = new URL(currentURL);
  var params = new URLSearchParams(url.search);
  var language = params.get('lng');
  if(language!="fr") language = "ar";

  initTranslation(language);

  //--------------------- Loading ---------------------
  //---------------------------------------------------


  //--------------------- Leaflet map -----------------
  var map = L.map('map',{zoomSnap: 0.3});
  
  map.fitBounds([
      //[38.75, -9.38],[20, 13.15]
      [37.302414, -9.38],[18.81, 13.15]
  ]);
  map.setMaxBounds(map.getBounds());

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    minZoom: 5,
    maxZoom: 8,
  }).addTo(map);
  //---------------------------------------------------


  //--------------------- Init vars -----------------
  var geoJSON_Algeria;
  var geoJSON_wilayas = [];
  
  var comptearebours;
  var spn_nbr_wilayas_trouves = document.getElementById("spn_nbr_wilayas_trouves");
  var nbr_wilayas_trouves = 0;
  
  let game_time = 300; //5:00
  var remaining_time = game_time;
  var spn_timer = document.getElementById("spn_timer");

  
  //init geoJSON files
  init_geoJSON_coordinates_Algeria();
  init_geoJSON_coordinates_wilayas();
  //---------------------------------------------------


  //--------------------- Functions -----------------
  function initDomElements(){
    h4_saisir_wilaya = document.getElementById("h4_saisir_wilaya");
    input_wilayas = document.getElementById("input_wilayas");  
    spn_liste_wilayas = document.getElementById("spn_liste_wilayas");
    THs_tableau_wilayas = document.getElementsByClassName("th-wilaya");
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

        h4_saisir_wilaya.innerHTML = translationData.txt_saisir_wilaya;
        input_wilayas.placeholder = translationData.hint_input_wilaya;
        spn_liste_wilayas.innerHTML = translationData.titre_liste_wilayas;
        [...THs_tableau_wilayas].forEach(element => {
          element.innerHTML = translationData.txt_tableau_wilayas;
        });
        
        liste_wilayas_display = translationData.liste_wilayas_display;
        liste_wilayas = translationData.liste_wilayas;
        nbr_wilayas = liste_wilayas.length-1;

        titre_swal_fin = translationData.titre_toast_fin;
        score_swal_fin = translationData.score_toast_fin;
        temps_swal_fin = translationData.temps_toast_fin;
        btn_swal_fin = translationData.btn_toast_fin;

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

  function init_geoJSON_coordinates_Algeria(){
    fetch('./assets/json/geoJSON_coordinates/Algeria.geojson')
    .then(response => response.text())
    .then((data) => {
      geoJSON_Algeria = JSON.parse(data);
    })
  }

  function drawAlgeriaBorders(){
    var AlgeriaBordersStyle = {
      "weight": 3.5,
      "fillColor": "#ffffff",
      "fillOpacity": 0.1,
    };
    var AlgeriaBorders = L.geoJSON(geoJSON_Algeria,{style: AlgeriaBordersStyle}).addTo(map);
  }

  function init_geoJSON_coordinates_wilayas(i=1){
    if(i<10) wilaya = "0"+i;
    else     wilaya = ""+i;
    fetch('./assets/json/geoJSON_coordinates/'+wilaya+'.geojson')
    .then(response => response.text())
    .then((data) => {
      geoJSON_wilayas[i] = JSON.parse(data);
      loading_level = parseInt(100*i/nbr_wilayas);
      if(i<nbr_wilayas) init_geoJSON_coordinates_wilayas(i+1);
      else getReadyToStartGame(); //End of loading
    })
  }

  function drawWilayaBorders(id_wilaya,nom_wilaya,unfound=false){
    var WilayaBordersStyle = {"color": "#3388FF","weight": 1.2,};
    if(unfound) WilayaBordersStyle = {"color": "#a3342c","weight": 1.0,};
    var wilayaBorders = L.geoJSON(geoJSON_wilayas[id_wilaya],{style: WilayaBordersStyle}).addTo(map);
    
    //Initialiser le popup à sa création (Afficher puis masquer), pour pouvoir l'activer on mouseover plus tard
    var wilayaPopup = L.popup({offset: [0, 0]}).setContent(nom_wilaya);
    wilayaBorders.bindPopup(wilayaPopup).openPopup();
    map.closePopup()

    //Popup events on map
    wilayaBorders.on('mouseover', function(){map.openPopup(wilayaPopup)});
    wilayaBorders.on('mouseout', function(){map.closePopup()});

    //Popup events on list
    td_element = document.getElementById("td"+id_wilaya);          
    td_element.onmouseover = function(){map.openPopup(wilayaPopup)};
    td_element.onmouseout = function(){map.closePopup()};
  }

  function getReadyToStartGame(){
    if(language=="ar") input_wilayas.style.textAlign = "right";

    //Display div_main
    document.getElementById('div_main').style.visibility = "visible";
    
    //Draw Algeria borders
    drawAlgeriaBorders();

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
    //Init span nbr_wilayas_trouves 
    spn_nbr_wilayas_trouves.innerHTML = nbr_wilayas_trouves+" / "+nbr_wilayas;
  
    //Start timer
    comptearebours = setInterval(updateTimer, 1000);
    
    //Handle input_wilayas 
    input_wilayas.focus(); //Set focus
    input_wilayas.onkeyup = function() {checkEnteredValue(input_wilayas.value)}; //Add onkeyup listener
  }

  function toLowerCaseWithoutAccents(text){
    (language=="ar") ? result = text : result = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    result = result.trim();
    
    //Handle wilaya names variants
    if((language!="ar")){
      if(["elaghouat","el aghouat","elaghouet","el aghouet","laghouet"].includes(result)) result = "laghouat";
      else if(["oum elbouaghi","oum el bouaki","oum elbouaki","oum el bouaqi","oum elbouaqi","oum bouaghi","oum bouaki","oum bouaqi"].includes(result)) result = "oum el bouaghi";
      else if(["tamenrasset"].includes(result)) result = "tamanrasset";
      else if(["tbessa"].includes(result)) result = "tebessa";
      else if(["telemcen"].includes(result)) result = "tlemcen";
      else if(["tiziouzou","tizi-ouzou"].includes(result)) result = "tizi ouzou";
      else if(["jazair","eljazair","el jazair","djazair","eldjazair","el djazair"].includes(result)) result = "alger";
      else if(["jelfa"].includes(result)) result = "djelfa";
      else if(["belabbes","bel abbes","belabes","bel abes","sidi belabbes","sidi belabes","sidi bel abes"].includes(result)) result = "sidi bel abbes";
      else if(["galma"].includes(result)) result = "guelma";
      else if(["msila"].includes(result)) result = "m'sila";
      else if(["ouergla","wargla","wergla"].includes(result)) result = "ouargla";
      else if(["wahran","wahren"].includes(result)) result = "oran";
      else if(["elbayadh","bayadh","el bayedh","elbayedh","bayedh"].includes(result)) result = "el bayadh";
      else if(["ilizi"].includes(result)) result = "illizi";
      else if(["bba","elborj","elbordj","el borj","el bordj","bordj bouarreridj","bordj bouareridj","bordj bouarriridj","bordj bouariridj","bordj bou arriridj","bordj bou ariridj"].includes(result)) result = "bordj bou arreridj";
      else if(["eltarf","el taraf","eltaraf","el taref","eltaref","tarf","taref","taraf"].includes(result)) result = "el tarf";
      else if(["tissemsilet","tissemssilt","tissemssilet"].includes(result)) result = "tissemsilt";
      else if(["eloued","oued souf","ouedsouf"].includes(result)) result = "el oued";
      else if(["khenchla","khanchla"].includes(result)) result = "khenchela";
      else if(["soukahras","souq ahras","souqahras"].includes(result)) result = "souk ahras";
      else if(["tibaza"].includes(result)) result = "tipaza";
      else if(["ain eldefla","ain el defla","aindefla"].includes(result)) result = "ain defla";
      else if(["el naama","elnaama"].includes(result)) result = "naama";
      else if(["ain tmouchent","ain timouchent","temouchent","tmouchent","timouchent"].includes(result)) result = "ain temouchent";
      else if(["rilizane","rilizene","relizene","ghelizane","ghilizane","ghelizene","ghilizene"].includes(result)) result = "relizane";
      else if(["borj baji mokhtar","bordj baji mokhtar","borj badji mokhtar"].includes(result)) result = "bordj badji mokhtar";
      else if(["ouled djelal","wled djellal","wled djelal"].includes(result)) result = "ouled djellal";
      else if(["beniabbes","beniabes","beni abes","bni abbes","bni abes"].includes(result)) result = "beni abbes";
      else if(["ain salah"].includes(result)) result = "in salah";
      else if(["ain guezzam","ain gazzam","in gazzam"].includes(result)) result = "in guezzam";
      else if(["tougourt"].includes(result)) result = "touggourt";
      else if(["djanat"].includes(result)) result = "djanet";
      else if(["elm'ghair","m'ghair","el mghair","elmghair","mghair"].includes(result)) result = "el m'ghair";
      else if(["elmeniaa","meniaa"].includes(result)) result = "el meniaa";
    }
    else{
      if(["ادرار"].includes(result)) result = "أدرار";
      else if(["شلف"].includes(result)) result = "الشلف";
      else if(["لغواط","الاغواط","اغواط","أغواط"].includes(result)) result = "الأغواط";
      else if(["ام البواقي"].includes(result)) result = "أم البواقي";
      else if(["بليدة"].includes(result)) result = "البليدة";
      else if(["بويرة"].includes(result)) result = "البويرة";
      else if(["تمنغست","تمنغاست"].includes(result)) result = "تمنراست";
      else if(["جزائر","الجزاير","جزاير","الجزاءر","جزاءر","العاصمة"].includes(result)) result = "الجزائر";
      else if(["جلفة"].includes(result)) result = "الجلفة";
      else if(["بلعباس"].includes(result)) result = "سيدي بلعباس";
      else if(["مدية"].includes(result)) result = "المدية";
      else if(["مستغانيم","مستغاليم"].includes(result)) result = "مستغانم";
      else if(["مسيلة"].includes(result)) result = "المسيلة";
      else if(["بيض"].includes(result)) result = "البيض";
      else if(["اليزي"].includes(result)) result = "إليزي";
      else if(["البرج"].includes(result)) result = "برج بوعريريج";
      else if(["طارف"].includes(result)) result = "الطارف";
      else if(["تيندوف"].includes(result)) result = "تندوف";
      else if(["تسمسيلت"].includes(result)) result = "تيسمسيلت";
      else if(["وادي سوف","واد سوف","وادي"].includes(result)) result = "الوادي";
      else if(["سوق اهراس"].includes(result)) result = "سوق أهراس";
      else if(["عين الدفلة","عين دفلى","عين دفلة"].includes(result)) result = "عين الدفلى";
      else if(["نعامة"].includes(result)) result = "النعامة";
      else if(["عين تيموشنت","تموشنت","تيموشنت"].includes(result)) result = "عين تموشنت";
      else if(["غيليزان"].includes(result)) result = "غليزان";
      else if(["تميمون"].includes(result)) result = "تيميمون";
      else if(["اولاد جلال","ولاد جلال"].includes(result)) result = "أولاد جلال";
      else if(["ان صالح","عين صالح"].includes(result)) result = "إن صالح";
      else if(["ان قزام","عين قزام"].includes(result)) result = "إن قزام";
      else if(["مغير"].includes(result)) result = "المغير";
      else if(["منيعة"].includes(result)) result = "المنيعة";
    }

    return result;
  }

  function checkEnteredValue(v){
    if(v!=""){
      valueToCheck = toLowerCaseWithoutAccents(v);
      if(liste_wilayas.includes(valueToCheck)){
          num_wilaya = liste_wilayas.indexOf(valueToCheck);
          nom_wilaya = liste_wilayas_display[num_wilaya];

          td_element = document.getElementById("td"+num_wilaya);
          td_element.classList.add("found-wilaya");
          td_element.innerHTML = nom_wilaya;

          liste_wilayas[num_wilaya] = "";
          drawWilayaBorders(num_wilaya,nom_wilaya);
          nbr_wilayas_trouves++;
          spn_nbr_wilayas_trouves.innerHTML = nbr_wilayas_trouves+" / "+nbr_wilayas;
          input_wilayas.value = "";

          if(nbr_wilayas_trouves==nbr_wilayas) endGame();
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
      spn_timer.innerHTML = displayFormattedTime(remaining_time);
      if(remaining_time==0) endGame();
  }

  function endGame(){
    clearInterval(comptearebours);
    input_wilayas.remove();
    spn_timer.remove();

    (language=="ar") ? txt_wilayas_trouvees = nbr_wilayas+"/"+nbr_wilayas_trouves : txt_wilayas_trouvees = nbr_wilayas_trouves+"/"+nbr_wilayas;
    end_game_message = "&#x1F3AF "+score_swal_fin+txt_wilayas_trouvees;
    if(remaining_time>0) {
      time_spent = game_time - remaining_time;
      end_game_message += "<br><br>&#x231A "+temps_swal_fin+displayFormattedTime(time_spent);
    }
    else if(nbr_wilayas_trouves<nbr_wilayas){
      showUnfoundWilayas();
    }
    
    Swal.fire({
      title: titre_swal_fin,
      html: end_game_message, 
      confirmButtonText: btn_swal_fin,     
    });
  }

  function showUnfoundWilayas(){
    console.log("showUnfoundWilayas",liste_wilayas);
    liste_wilayas.forEach((element, index) => {
      if (element !== "") {
        num_wilaya = index;
        nom_wilaya = liste_wilayas_display[num_wilaya];
        drawWilayaBorders(num_wilaya,nom_wilaya,true);
        td_element = document.getElementById("td"+num_wilaya);
        td_element.classList.add("unfound-wilaya");
        td_element.innerHTML = nom_wilaya;
      }
    });
  }
  //-------------------------------------------------

});