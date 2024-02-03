(function ($) {
    "use strict";

    /*Sale statistics Chart*/
    if ($('#myChart').length) {
        var ctx = document.getElementById('myChart').getContext('2d');
        var monthlySalesData = JSON.parse(document.getElementById('monthlySales').value);

        var allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        //sales
        var totalOrdersMap  = Object.fromEntries(allMonths.map(month => [month, 0]));
        monthlySalesData.forEach(entry => {
            var monthName = allMonths[entry.month - 1]; 
            totalOrdersMap[monthName] = entry.totalOrders; 
        });
        var totalOrders = allMonths.map(month => totalOrdersMap[month]);
        
        //users
        var monthlyUserRegistrations = JSON.parse(document.getElementById('monthlyusers').value);
        var totalUsersMap = Object.fromEntries(allMonths.map(month => [month, 0]));
        monthlyUserRegistrations.forEach(entry => {
            var monthName = allMonths[entry.day - 1]; // Assuming day in the data is 1-based
            totalUsersMap[monthName] = entry.total;
        });
        
        var totalUsers = allMonths.map(month => totalUsersMap[month]);
       
       
       //prodcucts 
       
       var monthlyProductDetails = JSON.parse(document.getElementById('monthlyproducts').value);
       var totalProductsMap = Object.fromEntries(allMonths.map(month => [month, 0]));

       monthlyProductDetails.forEach(entry => {
       var monthName = allMonths[entry.month - 1]; // Assuming month in the data is 1-based
       totalProductsMap[monthName] = entry.total;
       });

       var totalProducts = allMonths.map(month => totalProductsMap[month]);
       

       //monthly revenw
       var totalSalesMap = Object.fromEntries(allMonths.map(month => [month, 0]));
       monthlySalesData.forEach(entry => {
        var monthName = allMonths[entry.month - 1];
        totalSalesMap[monthName] = entry.total;
    });
    var totalSales = allMonths.map(month => totalSalesMap[month]);




       
        var chart = new Chart(ctx, {
            
            type: 'line',
            
       
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                        label: 'Sales',
                        tension: 0.3,
                        fill: true,
                        backgroundColor: 'rgba(44, 120, 220, 0.2)',
                        borderColor: 'rgba(44, 120, 220)',
                        data: totalOrders 
                    },
                    {
                        label: 'Users',
                        tension: 0.3,
                        fill: true,
                        backgroundColor: 'rgba(4, 209, 130, 0.2)',
                        borderColor: 'rgb(4, 209, 130)',
                        data: totalUsers
                    },
                    {
                        label: 'Products',
                        tension: 0.3,
                        fill: true,
                        backgroundColor: 'rgba(380, 200, 230, 0.2)',
                        borderColor: 'rgb(380, 200, 230)',
                        data: totalProducts
                    }

                ]
            },
            options: {
                plugins: {
                legend: {
                    labels: {
                    usePointStyle: true,
                    },
                }
                }
            }
        });
    } //End if

    /*Sale statistics Chart*/
    if ($('#myChart2').length) {
        var ctx = document.getElementById("myChart2");
        var myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [
                    {
                        label: "Region",
                        backgroundColor: [
                            "#5897fb", "#7bcf86", "#ff9076", "#d595e5",
                            "#5897fb", "#7bcf86", "#ff9076", "#d595e5",
                            "#5897fb", "#7bcf86", "#ff9076", "#d595e5"
                        ],
                        barThickness: 10,
                        data: totalSales
                    },
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }//end if
    
})(jQuery);