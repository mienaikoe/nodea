# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20131213045024) do

  create_table "circuits", force: true do |t|
    t.string   "name"
    t.string   "javascript_name"
    t.text     "description"
    t.integer  "user_id"
    t.string   "filename"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "nodas", force: true do |t|
    t.integer "circuit_id"
    t.integer "project_id"
    t.integer "ordinal"
    t.text    "settings"
  end

  add_index "nodas", ["project_id", "circuit_id"], name: "index_nodas_on_project_id_and_circuit_id"

  create_table "notes", id: false, force: true do |t|
    t.integer "noda_id"
    t.integer "start"
    t.integer "finish"
  end

  create_table "projects", force: true do |t|
    t.string   "name"
    t.text     "description"
    t.integer  "bpm"
    t.integer  "beat"
    t.integer  "beat_count"
    t.string   "keyset"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "projects_users", id: false, force: true do |t|
    t.integer "user_id",    null: false
    t.integer "project_id", null: false
  end

  create_table "users", force: true do |t|
    t.string   "alias"
    t.string   "nickname"
    t.string   "passdigest"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "users", ["alias"], name: "index_users_on_alias", unique: true

end
