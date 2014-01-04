json.(project, :id, :name, :description, :beats_per_minute, :beats_per_bar, :keyset, :bar_count)
json.authors project.authors do |author|
    json.handle author.handle
    json.nickname author.nickname
end
json.circuits do
    project.unique_circuits.each do |circuit|
        json.set! circuit.id do
            json.(circuit, :name, :handle, :description)
            json.image circuit.image
            json.script circuit.script
            json.author do 
                json.handle circuit.author.handle
                json.nickname circuit.author.nickname
            end
        end
    end
end
json.nodas project.nodas do |noda|
    json.(noda, :ordinal, :circuit_id)
    json.settings JSON.parse(noda.settings)
    json.notes noda.notes do |note|
        json.(note, :start, :finish)
    end
end