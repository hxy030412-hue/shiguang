<template>
  <div class="app">
    <NavBar
      :darkMode="darkMode"
      @toggle-dark="darkMode = !darkMode"
    />
    <router-view
      :photos="photos"
      :darkMode="darkMode"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import NavBar from './components/NavBar.vue'

const darkMode = ref(false)

watch(darkMode, (val) => {
  document.body.classList.toggle('dark-mode', val)
})

const photos = ref([
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
    title: '阿尔卑斯山的日出',
    date: '2024年7月15日',
    location: '瑞士·少女峰',
    people: '小明、小红',
    story: '凌晨四点出发，徒步两个小时到达观景台。当第一缕阳光穿透云层照在雪峰上时，所有的疲惫都值了。那一刻觉得世界真大，自己真小。',
    lat: 46.5587, lng: 7.9960
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    title: '马尔代夫的星空海滩',
    date: '2024年1月20日',
    location: '马尔代夫·马累',
    people: '独自一人',
    story: '赤脚走在荧光海滩上，抬头是满天繁星，低头是发光的浮游生物。第一次觉得孤独也可以是享受。',
    lat: 4.1755, lng: 73.5093
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
    title: '京都的秋日红叶',
    date: '2024年11月8日',
    location: '日本·京都·清水寺',
    people: '家人',
    story: '和爸妈一起赏枫，妈妈一直在拍照，爸爸假装嫌弃但笑得最开心。晚上一起吃了热腾腾的寿喜烧。',
    lat: 34.9949, lng: 135.7850
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600',
    title: '迪拜的沙漠黄昏',
    date: '2024年3月5日',
    location: '阿联酋·迪拜',
    people: '同事们',
    story: '公司团建去沙漠冲沙，车子在沙丘上飞驰的时候所有人都在尖叫。晚上围着篝火吃烤肉，阿拉伯红茶意外地好喝。',
    lat: 25.2048, lng: 55.2708
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600',
    title: '新西兰的蒂卡波湖',
    date: '2024年2月14日',
    location: '新西兰·蒂卡波',
    people: '女朋友',
    story: '情人节的特别旅行，湖水蓝得不像话。晚上去天文台看银河，她说这是收到过最好的礼物。',
    lat: -44.0047, lng: 170.4769
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=600',
    title: '圣托里尼的白房子',
    date: '2024年9月12日',
    location: '希腊·圣托里尼',
    people: '大学室友',
    story: '毕业旅行的最后一站，四个大男生在蓝顶教堂前合影，笑得像傻子。约定十年后再来一次。',
    lat: 36.3932, lng: 25.4615
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600',
    title: '冰岛的极光之夜',
    date: '2024年12月3日',
    location: '冰岛·雷克雅未克',
    people: '摄影团的朋友们',
    story: '等了三个小时，手都冻僵了。当绿色的光带开始在天空舞动的时候，所有人都安静了。大自然的震撼无法用照片表达。',
    lat: 64.1466, lng: -21.9426
  },
  {
    id: 8,
    url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600',
    title: '托斯卡纳的田园风光',
    date: '2024年5月18日',
    location: '意大利·佛罗伦萨',
    people: '和爸妈',
    story: '自驾穿越托斯卡纳，路两边是金色的麦田和丝柏树。在路边小酒庄喝了一杯当地的红酒，爸爸说这是他喝过最好的酒。',
    lat: 43.7696, lng: 11.2558
  },
  {
    id: 9,
    url: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=600',
    title: '摩洛哥的蓝色小镇',
    date: '2024年4月22日',
    location: '摩洛哥·舍夫沙万',
    people: '旅途中认识的朋友',
    story: '迷路在蓝色的小巷里，遇到了一只懒洋洋的猫。当地老人请我们喝薄荷茶，虽然语言不通但笑容是最好的交流。',
    lat: 35.1714, lng: -5.2697
  },
  {
    id: 10,
    url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=600',
    title: '挪威的峡湾',
    date: '2024年8月9日',
    location: '挪威·卑尔根',
    people: '独自一人',
    story: '一个人坐邮轮穿越峡湾，两岸是陡峭的山壁和瀑布。带了一本书却一直没翻开，光是看着窗外就足够了。',
    lat: 60.3913, lng: 5.3221
  },
  {
    id: 11,
    url: 'https://images.unsplash.com/photo-1502301103665-0b95cc738daf?w=600',
    title: '土耳其的热气球',
    date: '2024年6月1日',
    location: '土耳其·卡帕多奇亚',
    people: '女朋友',
    story: '清晨五点坐上热气球，看着上百个热气球同时升空，地面是奇特的地貌。她紧紧抓着我的手，说怕高但不想闭眼。',
    lat: 38.6431, lng: 34.8293
  },
  {
    id: 12,
    url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600',
    title: '云南的梯田日落',
    date: '2024年10月15日',
    location: '中国·云南·元阳',
    people: '摄影俱乐部',
    story: '为了拍到最好的光线，在田埂上蹲了两个小时。梯田在夕阳下像一面面镜子，倒映着天空的颜色。',
    lat: 23.0843, lng: 102.8440
  }
])
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f0;
  min-height: 100vh;
  transition: background 0.5s;
}
body.dark-mode {
  background: #151210;
}
</style>
