import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import GameBoard from '@/components/GameBoard'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'GameBoard',
      component: GameBoard
    }
  ]
})
