document.addEventListener("DOMContentLoaded", function(event) {

  //--------------------- Loading ---------------------
  var loading_level = 0;
  Swal.fire({
    title: 'Chargement',
    html: 'Veuillez patienter pendant le Chargement du jeu <br><b></b>',
    
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
          b.textContent = loading_level+"%";
        }, 200)
    },
    willClose: () => {
        clearInterval(timerInterval)
    }
  });
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
  var input_wilayas = document.getElementById("input_wilayas");
  var spn_nbr_wilayas_trouves = document.getElementById("spn_nbr_wilayas_trouves");
  var nbr_wilayas_trouves = 0;

  var liste_wilayas_display = ["","Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arreridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa"];
  var liste_wilayas = ["","adrar","chlef","laghouat","oum el bouaghi","batna","bejaia","biskra","bechar","blida","bouira","tamanrasset","tebessa","tlemcen","tiaret","tizi ouzou","alger","djelfa","jijel","setif","saida","skikda","sidi bel abbes","annaba","guelma","constantine","medea","mostaganem","m'sila","mascara","ouargla","oran","el bayadh","illizi","bordj bou arreridj","boumerdes","el tarf","tindouf","tissemsilt","el oued","khenchela","souk ahras","tipaza","mila","ain defla","naama","ain temouchent","ghardaia","relizane","timimoun","bordj badji mokhtar","ouled djellal","beni abbes","in salah","in guezzam","touggourt","djanet","el m'ghair","el meniaa"];

  let nbr_wilayas = liste_wilayas.length-1;
  
  let game_time = 300; //5:00
  var remaining_time = game_time;
  var spn_timer = document.getElementById("spn_timer");

  
  //init geoJSON files
  init_geoJSON_coordinates_Algeria();
  init_geoJSON_coordinates_wilayas();
  //---------------------------------------------------


  //--------------------- Functions -----------------
  function init_geoJSON_coordinates_Algeria(){
    fetch('../assets/json/geoJSON_coordinates/Algeria.geojson')
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
    fetch('../assets/json/geoJSON_coordinates/'+wilaya+'.geojson')
    .then(response => response.text())
    .then((data) => {
      geoJSON_wilayas[i] = JSON.parse(data);
      loading_level = parseInt(100*i/nbr_wilayas);
      if(i<nbr_wilayas) init_geoJSON_coordinates_wilayas(i+1);
      else startGameReady(); //End of loading
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

  function startGameReady(){
    //Display div_main
    document.getElementById('div_main').style.visibility = "visible";
    
    //Draw Algeria borders
    drawAlgeriaBorders();

    //Start game message
    Swal.fire({
      title: 'Nouvelle partie',
      html: 'Il y a 58 wilayas (villes) en Algérie. Essayez d\'en nommer le maximum en 5 minutes chrono !<br><br>&#x1F4A1; À chaque fois qu\'une wilaya est trouvée, elle apparait sur la carte et son nom est affiché dans la liste.',
      confirmButtonText: 'Commencer le jeu',
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
    result = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    result = result.trim();
    
    //Handle wilaya names variants
    if(["elaghouat","el aghouat","elaghouet","el aghouet","laghouet"].includes(result)) result = "laghouat";
    else if(["oum elbouaghi","oum el bouaki","oum elbouaki","oum el bouaqi","oum elbouaqi","oum bouaghi","oum bouaki","oum bouaqi"].includes(result)) result = "oum el bouaghi";
    else if(["tamenrasset"].includes(result)) result = "tamanrasset";
    else if(["tbessa","تبسة"].includes(result)) result = "tebessa";
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

    end_game_message = "&#x1F3AF Votre score = "+nbr_wilayas_trouves+"/"+nbr_wilayas;
    if(remaining_time>0) {
      time_spent = game_time - remaining_time;
      end_game_message += "<br><br>&#x231A Votre temps = "+displayFormattedTime(time_spent);
    }
    else if(nbr_wilayas_trouves<nbr_wilayas){
      showUnfoundWilayas();
    }
    
    Swal.fire({
      title: 'Partie terminée',
      html: end_game_message,      
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