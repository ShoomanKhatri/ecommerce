import Chart from "react-apexcharts";
import { useGetUsersQuery } from "../../redux/api/usersApiSlice";
import {
  useGetTotalOrdersQuery,
  useGetTotalSalesByDateQuery,
  useGetTotalSalesQuery,
} from "../../redux/api/orderApiSlice";
import { useState, useEffect } from "react";
import AdminMenu from "./AdminMenu";
import OrderList from "./OrderList";
import Loader from "../../components/Loader";

const AdminDashboard = () => {
  const {
    data: sales,
    isLoading: loadingSales,
    refetch: refetchSales,
  } = useGetTotalSalesQuery();
  const {
    data: customers,
    isLoading: loadingCustomers,
    refetch: refetchCustomers,
  } = useGetUsersQuery();
  const {
    data: orders,
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useGetTotalOrdersQuery();
  const { data: salesDetail } = useGetTotalSalesByDateQuery();

  const [state, setState] = useState({
    options: {
      chart: {
        type: "line",
        toolbar: {
          show: false,
        },
      },
      tooltip: {
        theme: "dark",
      },
      colors: ["#00E396"], // Color for sales line
      dataLabels: {
        enabled: true,
        style: {
          colors: ["#FFFFFF"], // Sales numbers in pure white
        },
      },
      stroke: {
        curve: "smooth",
      },
      title: {
        text: "Sales Trend",
        align: "left",
        style: {
          color: "#FFFFFF", // Title in pure white
        },
      },
      grid: {
        borderColor: "#ccc",
      },
      markers: {
        size: 1,
      },
      xaxis: {
        categories: [],
        title: {
          text: "Date",
          style: {
            color: "#FFFFFF", // Date label in pure white
          },
        },
        labels: {
          style: {
            colors: ["#FFFFFF"], // X-axis numbers in pure white
          },
        },
      },
      yaxis: {
        title: {
          text: "Sales",
          style: {
            color: "#FFFFFF", // Sales label in pure white
          },
        },
        labels: {
          style: {
            colors: ["#FFFFFF"], // Y-axis numbers in pure white
          },
        },
        min: 0,
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        floating: true,
        offsetY: -25,
        offsetX: -5,
        labels: {
          colors: ["#FFFFFF"], // Legend labels in pure white
        },
      },
    },
    series: [{ name: "Sales", data: [] }],
  });

  useEffect(() => {
    refetchSales();
    refetchCustomers();
    refetchOrders();

    if (salesDetail) {
      const formattedSalesDate = salesDetail.map((item) => ({
        x: item._id,
        y: item.totalSales,
      }));

      setState((prevState) => ({
        ...prevState,
        options: {
          ...prevState.options,
          xaxis: {
            categories: formattedSalesDate.map((item) => item.x),
          },
        },
        series: [
          { name: "Sales", data: formattedSalesDate.map((item) => item.y) },
        ],
      }));
    }
  }, [refetchSales, refetchCustomers, refetchOrders, salesDetail]);

  return (
    <>
      <AdminMenu />
      <section className="xl:ml-[4rem] md:ml-[0rem]">
        <div className="w-[80%] flex justify-around flex-wrap">
          <div className="rounded-lg bg-black p-5 w-[20rem] mt-5">
            <div className="font-bold rounded-full w-[3rem] bg-pink-500 text-center p-3">
              {/* Add an appropriate icon here if needed */}
            </div>
            <p className="mt-5">Sales</p>
            <h1 className="text-xl font-bold">
              {loadingSales ? <Loader /> : sales?.totalSales?.toFixed(2)}
            </h1>
          </div>

          <div className="rounded-lg bg-black p-5 w-[20rem] mt-5">
            <div className="font-bold rounded-full w-[3rem] bg-pink-500 text-center p-3">
              {/* Add an appropriate icon here if needed */}
            </div>
            <p className="mt-5">Customers</p>
            <h1 className="text-xl font-bold">
              {loadingCustomers ? <Loader /> : customers?.length}
            </h1>
          </div>

          <div className="rounded-lg bg-black p-5 w-[20rem] mt-5">
            <div className="font-bold rounded-full w-[3rem] bg-pink-500 text-center p-3">
              {/* Add an appropriate icon here if needed */}
            </div>
            <p className="mt-5">All Orders</p>
            <h1 className="text-xl font-bold">
              {loadingOrders ? <Loader /> : orders?.totalOrders}
            </h1>
          </div>
        </div>

        <div className="ml-[10rem] mt-[0.5rem]">
          <Chart
            options={state.options}
            series={state.series}
            type="bar"
            width="70%"
          />
        </div>

        <div className="mt-[4rem]">
          <OrderList />
        </div>
      </section>
    </>
  );
};

export default AdminDashboard;
