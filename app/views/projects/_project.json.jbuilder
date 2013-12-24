json.(project, :name, :description, :bpm, :beat, :keyset, :beat_count)
json.authors project.authors do |author|
    json.alias author.alias
    json.nickname author.nickname
end
json.circuits do
    project.unique_circuits.each do |circuit|
        json.set! circuit.id do
            json.(circuit, :name, :javascript_name, :description)
            json.location circuit.location
            json.author do 
                json.alias circuit.author.alias
                json.nickname circuit.author.nickname
            end
        end
    end
end
json.nodas project.nodas do |noda|
    json.(noda, :ordinal, :circuit_id)
    json.settings JSON.parse(noda.settings)
    json.notes noda.notes do |note|
        json.(note, :on, :off)
    end
end