Nodea::Application.routes.draw do
  
  resources :samples
  resources :users

  get "studio", to: 'studio#index'
  
end
