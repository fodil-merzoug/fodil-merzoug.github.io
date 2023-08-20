$(window).on('scroll',function(){
  ListOfLottieAnimations_startOnScroll.forEach(function(LottieAnimation){
      if($("#"+LottieAnimation["DOMelementId_inView"]).inView() && !LottieAnimation["dejaAfficheAnim"]){
          //console.log("Element reached by scroll !!!",LottieAnimation["DOMelementId_inView"]);
          LottieAnimation["dejaAfficheAnim"] = true;
          setTimeout(function() {
              console.log(LottieAnimation["delai_affichage"]+"ms passed !");
              if(LottieAnimation["num_frame_cut"]!=null)
                  LottieAnimation["myAnimation"].playSegments([0,LottieAnimation["num_frame_cut"]], true);
              else 
                  LottieAnimation["myAnimation"].play();
          }, LottieAnimation["delai_affichage"]);
      }
  });
  
  if(detectMob()){
      ListOfLottieAnimations_startOnScrollOnMobile.forEach(function(LottieAnimation){
          if($("#"+LottieAnimation["DOMelementId_inView"]).inView() && !LottieAnimation["dejaAfficheAnim"]){
              if(LottieAnimation["num_frame_cut"]!=null)
                  LottieAnimation["myAnimation"].playSegments([0,LottieAnimation["num_frame_cut"]], true);
              else 
                  LottieAnimation["myAnimation"].play();
              LottieAnimation["dejaAfficheAnim"] = true;
          }
      });
  }
});