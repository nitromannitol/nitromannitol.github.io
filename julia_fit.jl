using PyPlot

data = readcsv("data.csv")
dates = data[2:end,1];
count = Int.(data[2:end,2])

function fitLinear(x,y)
	#do linear fit 
	x_mat = zeros(2,length(x));
	x_mat[1,:]=1;
	x_mat[2,:]=x;
	beta_hat = pinv(x_mat')*y;
	return beta_hat[1],beta_hat[2];
end

function fitExp(x,y)
	x_mat = zeros(2,length(x));
	x_mat[1,:]=1;
	x_mat[2,:]=x;
	beta_hat = pinv(x_mat')*log.(y);
	a1 = exp(beta_hat[1]);
	a2 = beta_hat[2];
	return a1,a2;
end


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






#linear fit with constant offset
b1, b2 = fitLinear(days,counts);

#exponential fit
a1,a2 = fitExp(days,counts);


linear_fit = Float64.(zeros(days))
exp_fit = Float64.(zeros(days))


for d in days
	exp_fit[Int(d)] =a1*exp.(a2*d)
end


for d in days
	linear_fit[Int(d)] =b1 + b2*d
end


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


### now study the difference 
new_cases = zeros(counts)
new_cases[1]=counts[1];
for i in 2:length(counts)
	new_cases[i] = counts[i]-counts[i-1];
end

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


 writecsv("data_fit.csv",data_out)

println("Linear: ", (b1,b2), "R^2: ", R2_linear)
println("Exp: ", (a1,a2), "R^2: ", R2_exp)


####################################
####################################
 #### NOW FIT THE DIFFERENCE
####################################

counts2 = [];
curr_ind = 1;
while(true)
	curr_ind = min(curr_ind+6, length(counts))
	push!(counts2, counts[curr_ind-1])
	if(curr_ind == length(counts))
		break;
	end
end


counts2 = copy(counts)


#counts_diff = copy(counts);
counts_diff = [];
for i in 2:length(counts2)
	push!(counts_diff,100*(counts2[i]-counts2[i-1])/(counts2[i-1]));
end

println(mean(counts_diff[end-6:end]))

##
#counts_diff = counts_diff[10:end]
clf()
#counts_diff = counts_diff[end-7:end]
scatter(1:length(counts_diff),counts_diff)
title("6-Day Growth Rate of COVID-19 Cases in Kuwait");
xlabel("6-Day Increment");
ylabel("Growth Rate")


#remove outliers and add 1
counts_diff_no_outliers = copy(counts_diff)
 counts_diff_no_outliers[1:3]=counts_diff_no_outliers[4]
counts_diff_no_outliers[7]=counts_diff_no_outliers[8]
counts_diff_no_outliers[18]=counts_diff_no_outliers[19]
counts_diff_no_outliers[counts_diff_no_outliers.==0]+=1;



#linear fit with constant offset
b1, b2 = fitLinear(days,counts_diff_no_outliers);

#exponential fit
a1,a2 = fitExp(days,counts_diff_no_outliers);


linear_fit = Float64.(zeros(days))
exp_fit = Float64.(zeros(days))


#manual fit
a1 = 4.8
a2 = 0.019;

#
b1 = 0.069
b2 = 5.29



for d in days
	exp_fit[Int(d)] =a1*exp.(a2*d)
end


for d in days
	linear_fit[Int(d)] = b1 + b2*d
end


#compute R^2 for linear regression 
SS_reg = 0
SS_tot = 0;
for  i in 1:length(days)
	SS_reg = SS_reg +  (linear_fit[i]-mean(counts_diff_no_outliers))^2;
	SS_tot = SS_tot + (counts[i] - mean(counts_diff_no_outliers))^2;
end
R2_linear = SS_reg/SS_tot;



#compute R^2 for exponential regression 
SS_reg = 0
SS_tot = 0;
for  i in 1:length(days)
	SS_reg = SS_reg +  (exp_fit[i]-mean(counts_diff_no_outliers))^2;
	SS_tot = SS_tot + (counts_diff[i] - mean(counts_diff_no_outliers))^2;
end
R2_exp = SS_reg/SS_tot;



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




str = "{"
for c in counts_diff
	str = string(str, c, ",")
end
str = string(str, "}");

### plot and save data
clf()
counts_diff = counts_diff[end-6:end]
scatter(days[1:length(counts_diff)],counts_diff)

#plot(days,linear_fit)
#plot(days,exp_fit)
title("Daily Growth Rate Percent of COVID-19 Cases in Kuwait");
xlabel("Last Week");
ylabel("Growth Rate %")

 writecsv("data_diff_fit.csv",data_out)
println("Linear: ", (b1,b2), "R^2: ", R2_linear)
println("Exp: ", (a1,a2), "R^2: ", R2_exp)

