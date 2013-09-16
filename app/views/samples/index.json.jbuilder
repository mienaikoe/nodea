json.array!(@samples) do |sample|
  json.extract! sample, :name, :description, :user_id, :file
  json.url sample_url(sample, format: :json)
end
