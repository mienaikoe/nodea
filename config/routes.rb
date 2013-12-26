Nodea::Application.routes.draw do
  
  resources :circuits
  resources :projects
  resources :users

  get "studio", to: 'studio#index'
  post "studio/save", to: 'studio#save'
  
end
