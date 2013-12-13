Nodea::Application.routes.draw do
  
  resources :circuits
  resources :projects
  resources :users

  get "studio", to: 'studio#index'
  
end
