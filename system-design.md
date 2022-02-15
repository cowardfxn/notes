# System Design

[Ref](https://www.geeksforgeeks.org/getting-started-with-system-design/)

#### Reliability

A system is reliable when it can meet the end-user requirement.

A **Fault tolerant** system can be one that can continue to be functioning reliably even in the presence of faults.

* **Faults** the error that arise in a particular component of the system, it doesn't guarantee Failure of the system
* **Failure** the state when the system is not able to perform as expected

#### Availability

Availability is a characteristic of a System which aims to ensure an agreed level of Operational Performance, also known as *uptime*.

There are various principles you should follow in order to ensure the availability of your system:

- Your system should not have a Single Point of Failure, which make your entire system fails if only one point fails
- Detecting the failure and resolving it at that point

#### Scalability

Scalability refers to the ability of the system to cope up with the increasing load.

It's said that if you have to design a system for load **X** then you should plan to design it for **10X** and Test it for **100X**.

In order to ensure scalability you should be able to compute the load that your system will experience.

There are various factors that describe the Load on the system:

- Number of requests coming to your system for getting processed per day
- Number of Database calls made from your system
- Amount of Cache Hit or Miss requests to your system
- Users currently active on your system

