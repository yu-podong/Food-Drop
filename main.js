'use-strict'
/* 게임에 필요한 전역변수 선언 */
// canvas tag의 class name을 이용하여 canvas를 가져옴
let canvas = document.querySelector('.game-display');
// canvas에 랜더링 컨텍스트에 접근하여 내용을 그릴 수 하기 위해 (2D 그래픽이기에 `2d` 작성)
let context = canvas.getContext('2d');

// 배경화면 png를 담을 background 선언
let background = new Image();

// 플레이어
let player = {};

// 생성될 item들을 저장할 list 선언
let foodItemList = new Array();
let notFoodItemList = new Array();

// drop되는 item 중 food에 해당하는 image의 src (총 11개)
let foodSrcList = [
  './resource/drop-item/food/apple.png',
  './resource/drop-item/food/cake.png',
  './resource/drop-item/food/cherries.png',
  './resource/drop-item/food/cookie.png',
  './resource/drop-item/food/fruit.png',
  './resource/drop-item/food/grapes.png',
  './resource/drop-item/food/hamburger.png',
  './resource/drop-item/food/meat.png',
  './resource/drop-item/food/pizza.png',
  './resource/drop-item/food/taco.png',
  './resource/drop-item/food/watermelon.png',
];

// drop되는 item 중 food에 해당하지 않는 image의 src (총 3개)
let notFoodSrcList = [
  './resource/drop-item/kitchen utensils/cutlery.png',
  './resource/drop-item/kitchen utensils/kitchen-utensil.png',
  './resource/drop-item/kitchen utensils/pastry-bag.png',
];

// random 범위를 결정해줄 변수 (시간이 지날수록 수의 크기를 줄여서 더 많은 item이 나오도록 할 것)
let randomRange1 = 600;
let randomRange2 = 600;

// 생성할 수 item의 개수를 저장하는 변수
let numFood = 1;
let numNonFood = 1;

// 생성할 수 있는 item의 개수를 증가한 횟수를 저장하는 변수 (난이도 변경 횟수)
let foodCount = 0;
let nonFoodCount = 0;

//---------------------------------------------------------------------

/* 게임에 필요한 함수 정의 */
// 배경화면 그리기
function drawBackground() {
  background.src = './resource/background/in-game.png';
  context.drawImage(background, 0, 0, 400, 800);
}

// player를 생성하는 함수
function makePlayer() {
  // 이전 게임에서 설정되어있던 캐릭터의 property 초기화
  player.image = new Image();
  player.image.src = "./resource/player/player.png";
  player.life = 8;
  player.positionX = 0;
  player.positionY = 0;
  player.moveSpeed = 3;
  player.score = 0;
  player.isNoLife = false;
  player.pushLeft = false;
  player.pushRight = false;

  // 플레이어의 초기 위치 설정
  player.positionX = (400 / 2) - 50;
  player.positionY = 600;
}

// 입력된 key에 따라 해당하는 함수를 실행할 listener 등록
document.addEventListener("keydown", event => {
  // 왼쪽 화살표 키패드가 눌렸을 때
  if(event.keyCode == 37) {
    player.pushLeft = true;
  }
  // 오른쪽 화살표 키패드가 눌렸을 때
  else if(event.keyCode == 39) {
    player.pushRight = true;
  }
});

document.addEventListener("keyup", event => {
  // 왼쪽 화살표 키패드가 눌렸다가 때졌을 때
  if(event.keyCode == 37) {
    player.pushLeft = false;
  }
  // 왼쪽 화살표 키패드가 눌렸다가 때졌을 때
  else if(event.keyCode == 39) {
    player.pushRight = false;
  }
})

// 현재 키패드의 상황에 따라 player 이동
function movePlayer() {
  if(player.pushLeft) {
    // 플레이어의 x좌표(왼편)가 canvas를 넘어가면 0으로 설정하여 밖으로 넘어가지 않도록 설정
    player.positionX = (player.positionX + (-player.moveSpeed) < 0) ? 0 : player.positionX - player.moveSpeed;
  }
  if(player.pushRight) {
    // 플레이어의 x좌표 + 100 (오른편)이 canvas를 넘어가면 300으로 설정하여 밖으로 넘어가지 않도록 설정
    player.positionX = (player.positionX + player.moveSpeed > 300) ? 300 : player.positionX + player.moveSpeed;
  }
}

// player에게 남은 기회가 있는지 확인하는 함수
function isAlivePlayer() {
  // 남은 기회가 없다면, 남은 목숨이 없다고 설정
  if(player.life <= 0) {
    player.isNoLife = true;
  }
}

// player의 isDead가 true일 때 gameover
function isGameover() {
  // canvas를 초기화한 것이 아니기 때문에, item List들을 초기화 (생성되어있는 item)
  emptyItems();

  if(player.isNoLife) {
    let scoreResult = document.querySelector(".score-result");

    // 종료화면을 보여주고 main화면으로 돌아감
    player.image.src = "./resource/player/player-dead.png";
    context.drawImage(player.image, player.positionX, player.positionY, 100, 100)

    // end 화면 보여주기
    gameOverScreen.style.display = "block";
    // score 결과 보여주기
    scoreResult.style.display = "block";
    scoreResult.innerText = `${player.score}`
  }
}

// player 그리기
function drawPlayer() {
  context.drawImage(player.image, player.positionX, player.positionY, 100, 100)
}

// food item 생성
function MakeFoodItem() {
  // 생성할 Item의 개수를 랜덤으로 설정 (1 ~ randomRange1)
  // score가 올라갈수록 random 범위를 좁혀서 더 자주 item이 나오도록 조정
  let num = Math.floor(Math.random() * randomRange1) + 1;
  
  // 매 interval마다 item이 우후죽순으로 생겨나는 것을 방지(없으면 엄청난 일 발생)
  // 조금 다양한 set으로 item들이 나오기 위해 numFood개 이하의 item이 생길 수 있도록 설정
  if(num > numFood) {
    return;
  }
  
  // 일정 score를 얻게되면, 내려오는 item 개수 증가
  if(player.score > 100 && foodCount == 0) {
    numFood++;
    foodCount++;
  }
  // 일정 score를 얻으면, 내려오는 item 개수 증가 & random 범위 변경
  else if(player.score > 500 && foodCount == 1) {
    randomRange1 -= 100;
    numFood++;
    foodCount++;
  }

  // num개 만큼 food item 생성
  for(let i = 0; i < num; i++) {
    // drop할 item 생성 (초기값 설정)
    let item = {
      image: new Image(), // item의 이미지
      positionX: 0,       // drop할 때의 X 좌표
      positionY: 0,        // drop할 때의 Y 좌표
      isDead: false,       // player가 해당 item을 먹었는지 확인
      dropSpeed: 2        // drop될 때의 속도
    }

    // 500점이 넘을 시 item의 속도 변화
    if(foodCount == 1) {
      item.dropSpeed++;
    }
    
    // foodSrcList의 index 번호 중에서 하나를 골라 새로운 item의 src로 저장
    let selectItem = Math.floor(Math.random() * 11);
    item.image.src = foodSrcList[selectItem];

    // 첫번째 item의 생성 위치 지정
    if (i == 0) {
      // 앞으로의 위치 변경을 위해 position값 초기화
      item.positionX = Math.floor(Math.random() * 350 + 1);
      item.positionY = 0;
    }
    // 첫번째 이후의 item들은 첫번째 item 근처에서 생성되도록 설정
    else if (i > 0 && foodItemList[0].positionX > 200){
      item.positionX = Math.floor(Math.random() * 200 + (foodItemList[0].positionX - 200));
      item.positionY = Math.floor(Math.random() * 200 + 1);
    }
    else if(i > 0 && foodItemList[0].positionX < 200) {
      item.positionX = Math.floor(Math.random() * 200 + (foodItemList[0].positionX + 200));
      item.positionY = -Math.floor(Math.random() * 200 + 1);
    }
    
    // food list에 추가
    foodItemList.push(item);
  }
}

// non-food item 생성
function MakeNonFoodItem() {
  let num = Math.floor(Math.random() * randomRange2);

  // 매 interval마다 item이 우후죽순으로 생겨나는 것을 방지 (1개로 고정)
  if(num != numNonFood) {
    return;
  }

  // 혹시 모를 수정으로 100점이 넘으면 난이도 변경 횟수 증가
  if(player.score > 100 && nonFoodCount == 0) {
    nonFoodCount++;
  }

  // drop할 item 생성 (초기값 설정)
  let item = {
    image: new Image(), // item의 이미지
    initialX:0,         // drop 직전 X 좌표
    initialY:0,         // drop 직전 Y 좌표
    positionX: 0,       // drop할 때의 X 좌표
    positionY:0,        // drop할 때의 Y 좌표
    isDead:false,       // player가 해당 item을 먹었는지 확인
    dropSpeed: 2        // drop될 때의 속도
  };

  // food item과 동일하게 500점이 넘으면 non-food item의 속도 증가
  if(nonFoodCount == 1) {
    item.dropSpeed++;
  }

  // notFoodSrcList의 index 번호 중에서 하나를 골라 새로운 item의 src로 저장
  let selectItem = Math.floor(Math.random() * 3) ;
  item.image.src = notFoodSrcList[selectItem];

  // item의 초기 생성 위치 선정 (canvas 밖에 있다가 초마다 모습을 드러내도록)
  item.initialX = Math.floor(Math.random() * 350 + 1);
  item.initialY = 0;
  
  // 앞으로의 위치 변경을 위해 position값 초기화
  item.positionX = item.initialX;
  item.positionY = item.initialY;

  // non-food list에 추가
  notFoodItemList.push(item);
}

// moveSpeed만큼 items 이동
function moveItem() {
  // setInterval로 지정한 초마다 foodList에 들어있는 items들을 moveSpeed만큼 이동한 좌표 값 계산
  for(let i = 0; i < foodItemList.length; i++) {
    foodItemList[i].positionY += (foodItemList[i].dropSpeed);
  }

  // setInterval로 지정한 초마다 non-foodList에 들어있는 item들을 moveSpeed만큼 이동한 좌표 값 계산
  for (let i = 0; i < notFoodItemList.length; i++) {
    notFoodItemList[i].positionY += (notFoodItemList[i].dropSpeed);
  }
}

// Item이 player와 부딪쳤는지 판단
function crashItem() {
  // foodItem 중에서
  for(let i = 0; i < foodItemList.length; i++) {
    // 먄약, 플레이어가 먹은 아이템이 food일 경우, player의 score +10
    if(player.positionX+50 > foodItemList[i].positionX && player.positionX + 50 < foodItemList[i].positionX + 50 && player.positionY < foodItemList[i].positionY + 50 && player.positionY + 50 > foodItemList[i].positionY + 25) {
      foodItemList[i].isDead = true;
      player.score += 10;
    }
  }

  // nonFoodItem 중에서
  for(let i = 0; i < notFoodItemList.length; i++) {
    // 만약 먹은 아이템이 non-food일 때는 palyer.isDead = true (게임 오버)
    if(player.positionX+50 > notFoodItemList[i].positionX && player.positionX + 50 < notFoodItemList[i].positionX + 50 && player.positionY < notFoodItemList[i].positionY + 50 && player.positionY + 50 > notFoodItemList[i].positionY + 25) {
      notFoodItemList[i].isDead = true;
      player.isNoLife = true;
    }
  }
}

// canvas밖으로 item이 넘어갔는지 확인하는 함수
function outItem() {
  // food items
  for(let i = 0; i < foodItemList.length; i++) {
    // 플레이어가 해당 item을 먹지 못한 채로 화면 밖으로 넘어갈 때, player의 life -1
    if(foodItemList[i].positionY > 800)  {
      foodItemList[i].isDead = true;
      player.life -= 1;
    }
  }
  // non-food items
  for(let i = 0; i < notFoodItemList.length; i++) {
    // 플레이어가 해당 item을 먹지 못한 채로 화면 밖으로 넘어갈 때, 그냥 item만 죽이기(별다른 제약 X)
    if(notFoodItemList[i].positionY > 800)  {
      notFoodItemList[i].isDead = true;
    }
  }
}

// item중에 isDead인 것들을 list에서 삭제 (먹혔거나 화면 밖을 넘어간 item 삭제)
function removeItems() {
  // food item중에서
  for(let i = 0; i < foodItemList.length; i++) {
    // isDead이면 list에서 삭제
    if(foodItemList[i].isDead) {
      foodItemList.splice(i,1);
    }
  }
  // not food item 중에서 
  for(let i = 0; i < notFoodItemList.length; i++) {
    // isDead이면 list에서 삭제
    if(notFoodItemList[i].isDead) {
      notFoodItemList.splice(i,1);
    }
  }
}

// items 그리기
function drawItem() {
  for(let i = 0; i < foodItemList.length; i++) {
    context.drawImage(foodItemList[i].image, foodItemList[i].positionX, foodItemList[i].positionY, 50, 50);
  }
  for(let i = 0; i < notFoodItemList.length; i++) {
    context.drawImage(notFoodItemList[i].image, notFoodItemList[i].positionX, notFoodItemList[i].positionY, 50, 50);
  }
}

// 기존에 있던 items들 모두 삭제 (초기화)
function emptyItems() {
  foodItemList = [];
  notFoodItemList = [];
}

// 점수를 표시해 줄 html tag 가져오기
let scoreText = document.querySelector(".score");

// 현재 점수를 보여주는 함수
function displayScore() {
  // innerText를 이용하여 해당 tag 안에 score 점수를 넣음
  scoreText.innerText = `score : ${player.score}`;
}

//-------------------------------------------------------------------------

/* button이 클릭되었을 때 실행할 함수 선언 부분 */

let intervalId;
// 게임 메인 화면을 보여주는 tag를 가져오기
let mainScreen = document.querySelector('.main-screen');
// 게임 설명 화면을 구성하는 tag를 가져오기
let descriptScreen = document.querySelector('.descript-screen');
// 게임 오버 화면을 구성하는 tag를 가져오기
let gameOverScreen = document.querySelector('.game-over-screen');

// start 버튼이 클릭되면 시작되는 function (button의 onclick으로 설정함)
function gameStart() {
  // 우선, 이전의 설정값들을 초기화 (재시작을 고려하여)
  init();

  // 이전에 어떤 작업 지정한 설정 시간마다 실행하도록 했던 걸 더이상 진행하지 않음
  clearInterval(intervalId);

  // 시작화면 hidden (게임 메인 화면에서 `게임시작`으로 넘어왔을 경우)
  mainScreen.style.display = "none";
  // 게임 오버 화면 hidden (게임 오버 화면에서 `재시작`으로 넘어왔을 경우)
  gameOverScreen.style.display = "none";

  // 점수판이 보이도록 설정
  scoreText.style.display = "block";
  
  // 설정한 interval time마다 아래의 함수들 실행
  intervalId = setInterval(() => {
    // background 그리기
    drawBackground();
    // food, non-food item 생성
    MakeFoodItem();
    MakeNonFoodItem();
    // items 움직임
    moveItem();
    // 조건에 따라 item 삭제
    crashItem();
    outItem();
    removeItems();
    // item 그리기
    drawItem();
    // player가 누른 키패드에 따라 character 움직임
    movePlayer();
    // player에게 남은 기회가 있는지 확인
    isAlivePlayer();
    // 살아있다면 game 계속 진행, 죽었다면 game over
    if(player.isNoLife) {
      isGameover();
      // js가 주기적으로 실행되던 것을 멈춤 (interval 취소)
      clearInterval(intervalId);
    }
    // player 그리기
    drawPlayer();
    // score 계산
    displayScore();  
  }, 10);
}

function init() {
  // player 생성 및 property 초기화
  makePlayer();
  // item list 초기화
  emptyItems();
}


// 게임 설명 화면을 보여줌
function displayDescript() {  
  // 게임 메인 화면을 구성하는 tag를 안보이게 함
  mainScreen.style.display = "none";
  // 게임 설명 화면을 구성하는 tag를 보이도록 함
  descriptScreen.style.display = "block";
}

// 메인화면으로 돌아감
function backAction() {
  // 게임 메인 화면을 구성하는 tag를 보이도록 함
  mainScreen.style.display = "block";
  // 게임 설명 화면을 구성하는 tag를 안보이도록 함
  descriptScreen.style.display = "none";
}

// 메인화면으로 돌아감
function backMain() {
  // 게임 오버 화면을 구성하는 tag를 안보이도록 함
  gameOverScreen.style.display = "none";
  // 게임 메인 화면을 구성하는 tag를 보이도록 함
  mainScreen.style.display = "block";
}