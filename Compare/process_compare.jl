data = readcsv("/Users/ahmedbou-rabee/Desktop/Corona_Kuwait/nitromannitol.github.io/Compare/full_data.csv")
locations = readcsv("/Users/ahmedbou-rabee/Desktop/Corona_Kuwait/nitromannitol.github.io/Compare/locations.csv")

dates = data[2:end,1];
count = Int.(data[2:end,5]);
countries = data[2:end,2];
unique_countries = locations[2:end,1];
pop = locations[2:end,end]
deaths = data[2:end,end]; 



#the locations file replaces space by underscore
for i in 1:length(countries)
	c = countries[i];
	countries[i] = replace(c, ' ', '_')
	if(countries[i] == "United_States")
		countries[i] = "United_States_of_America";
	end
end

# check if the difference includes any big countries
setdiff(unique_countries,unique(countries))


## code for getting rid of duplicate entries
#z = zeros(length(unique(countries)))
#for i in 1:length(z)
#	cc = unique(countries)[i];
#	z[i] = sum(countries.==cc);
#end

## process the data and get rid of 
## empty entries or countries with no population
count_vec = []; 
country_list = []; 
pop_list = []; 
death_vec = []


i = 1; 
while(true)
	if(i > length(count)) break; end;
	curr_vec = []; 
	curr_vec2 = [];
	curr_country = countries[i]; 
	if(length(findn(unique_countries.==curr_country)) == 0) i = i+1; continue; end;
	curr_pop = pop[findn(unique_countries.==curr_country)[1]]
	if(typeof(curr_pop)!=Int64) i=i+1; continue; end;
	push!(country_list, curr_country)


	push!(pop_list, curr_pop)
	push!(curr_vec, count[i]); 
	push!(curr_vec2, deaths[i]);
	while(true)
		i = i + 1; 
		if(i > length(count) || countries[i]!=curr_country)
			break;
		end
		push!(curr_vec, count[i]) # 10^6*count[i]/pop[i])
		push!(curr_vec2, deaths[i]);
	end
	start_ind = findn(curr_vec.>)

	push!(count_vec,curr_vec)
	push!(death_vec, curr_vec2);
end




