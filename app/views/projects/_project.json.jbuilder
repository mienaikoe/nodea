json.(project, :name, :description, :bpm, :beat)
json.authors project.authors do |author|
    json.alias author.alias
    json.nickname author.nickname
end
json.circuits project.circuits.uniq{|circuit| circuit.id} do |circuit|
    json.(circuit, :id, :name, :description)
    json.location circuit.location
    json.author do 
        json.alias circuit.author.alias
        json.nickname circuit.author.nickname
    end
end
json.nodas project.nodas do |noda|
    json.(noda, :ordinal, :circuit_id, :settings)
    json.notes noda.notes do |note|
        json.(note, :on, :off)
    end
end