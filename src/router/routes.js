/* modes: ['onetime'] */
const routes = [
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: 'integration', component: () => import('pages/Integration.vue') },
      { path: 'mode/:mode/token/:token', component: () => import('pages/Index.vue') },
      { path: 'example', component: () => import('pages/example/IntegrationExample.vue') }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
