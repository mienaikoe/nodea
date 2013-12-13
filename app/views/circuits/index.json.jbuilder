json.array!(@circuits) do |circuit|
  json.extract! circuit, :name, :description, :user_id, :file
  json.url circuit_url(circuit, format: :json)
end
