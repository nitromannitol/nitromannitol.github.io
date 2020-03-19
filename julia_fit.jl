function getNextDay(date)
	match(Regex("%d-%b-%y"),"18-Mar-20")
end


data = readcsv("data.csv")
dates = data[2:end,1];
count = Int.(data[2:end,2])



#first flatten the data
days =  [];
counts = []
day = 1;
i = 1;
while(i < length(count))
	if(dates[i] != dates[i+1])
		push!(days, day)
		push!(counts, count[i])
		day+=1;
	end
	i+=1;
end
push!(days,day)
push!(counts,count[i])
dates = unique(dates)
days = Int.(days);
counts = Int.(counts)







#do exponential fit 
x_mat = zeros(2,length(counts));
x_mat[1,:]=1;
x_mat[2,:]=days;
beta_hat = pinv(x_mat')*log.(counts);
a1 = exp(beta_hat[1]);
a2 = beta_hat[2];


#do linear fit with constant offset
x_mat = zeros(2,length(counts));
x_mat[1,:]=1;
x_mat[2,:]=days;
beta_hat = pinv(x_mat')*counts;



#append!(day,day[end]+1)


linear_fit = Float64.(zeros(days))
exp_fit = Float64.(zeros(days))


for d in days
	exp_fit[Int(d)] =a1*exp.(a2*d)
end


for d in days
	linear_fit[Int(d)] = beta_hat[1] + beta_hat[2]*d
end

#date[end]= date[end-1]


#compute R^2 for linear regression 
SS_reg = 0
SS_tot = 0;
for  i in 1:length(days)
	SS_reg = SS_reg +  (linear_fit[i]-mean(counts))^2;
	SS_tot = SS_tot + (counts[i] - mean(counts))^2;
end
R2_linear = SS_reg/SS_tot;



#compute R^2 for exponential regression 
SS_reg = 0
SS_tot = 0;
for  i in 1:length(days)
	SS_reg = SS_reg +  (exp_fit[i]-mean(counts))^2;
	SS_tot = SS_tot + (counts[i] - mean(counts))^2;
end
R2_exp = SS_reg/SS_tot;




str = "{"
for c in counts
	str = string(str, c, ",")
end
str = string(str, "}");




### plot and save data
clf()
scatter(days[1:length(counts)],counts)

plot(days,linear_fit)
plot(days,exp_fit)

data_out = Array{Any,2}(length(days)+1,5)
data_out[1,1] = "date";
data_out[1,2] = "total_count";
data_out[1,3] = "day";
data_out[1,4] = "linear_fit"
data_out[1,5] = "exp_fit"

data_out[2:length(dates)+1,1] = dates;
data_out[2:end,2] = counts
data_out[2:end,3] = days;
data_out[2:end,4] = linear_fit;
data_out[2:end,5] = exp_fit;

println("Linear: ", (beta_hat[1],beta_hat[2]))
println("Exp: ", (a1,a2))

 writecsv("data_fit.csv",data_out)