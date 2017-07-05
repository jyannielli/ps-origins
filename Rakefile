# US boundaries
file "US_AtlasHCB_StateTerr_Gen05.zip" do
  system %[curl -O http://publications.newberry.org/ahcbp/downloads/gis/US_AtlasHCB_StateTerr_Gen05.zip]
end

file "US_AtlasHCB_StateTerr_Gen05" => ["US_AtlasHCB_StateTerr_Gen05.zip"] do |t|
  system %[unzip -o #{t.prerequisites.first}]
end

file "students-by-state.csv" do
  system %[xlsx -s "Static Chart" "Princeton Students Master List"*".xlsx" | sed "/^,.*/d" | sed "/^Totals.*/d" | tr ' ' '_' > students-by-state.csv]
end

file "students.csv" do
  system %[./mkstudents.sh]
end

file "us.json" => ["US_AtlasHCB_StateTerr_Gen05"] do
  system %[topojson -e students.csv --id-property ID -p -o us.json \
  states=US_AtlasHCB_StateTerr_Gen05/US_HistStateTerr_Gen05_Shapefile/US_HistStateTerr_Gen05.shp]

  # use 1784 borders for Virginia and Unorganized Federal Territory
  system %[sed -i "s/1784-03-01/1748-01-01/g" us.json]
  system %[sed -i 's/"va_state","VERSION":1,"START_DATE":"1783-09-03/"va_state","VERSION":1,"START_DATE":"1786-03-01/g' us.json]

  # adjust original thirteen start time
  system %[sed -i "s/1783-09-03/1748-01-01/g" us.json]
end

# Coastline
file "ne_50m_coastline.zip" do
  system %[wget http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/physical/ne_50m_coastline.zip]
end

file "coast.json" => ["ne_50m_coastline.zip"] do |t|
  system %[unzip -o #{t.prerequisites.first} -d ne_50m_coastline]
  # Clip to area around US
  system %[ogr2ogr -f "ESRI Shapefile" ocean_clipped \
           ne_50m_coastline/ne_50m_coastline.shp \
           -clipsrc -171, 12, -51, 62]
  system %[topojson -o coast.json coast=ocean_clipped/ne_50m_coastline.shp]
end


results = FileList["students-by-state.csv", "students.csv", "us.json", "coast.json"]

task :default => results

require "rake/clean"

CLEAN.include("US_AtlasHCB_StateTerr_Gen01",
             "ocean_clipped*",
             "ne_50m_coastline",
             "DC_AtlasHCB",
             "us.json",
             "coast.json",
             "students.csv",
             "students-by-state.csv")


CLOBBER.include("*.json")


