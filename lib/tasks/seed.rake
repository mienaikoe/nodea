namespace :db do
  namespace :seed do
    desc 'seed from wikimedia commons'
    task :wikimedia => :environment do
      filename = File.join(Rails.root, 'lib', 'tasks', 'wikimedia_commons_seed')
      require(filename)
      Seed::WikimediaCommonsSeed.seed!
    end
  end
end