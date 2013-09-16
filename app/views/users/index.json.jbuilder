json.array!(@users) do |user|
  json.extract! user, :alias, :nickname
  json.url user_url(user, format: :json)
end
