#!/usr/bin/env python3

import itertools
import time

# https://wiki.ros.org/rospy/Overview/Initialization%20and%20Shutdown
import rospy
rospy.init_node('test')

# https://wiki.ros.org/rospy/Overview/Messages
from std_msgs.msg import Float64

# https://wiki.ros.org/rospy/Overview/Publishers%20and%20Subscribers
waist_controller = rospy.Publisher(
    '/vx300s/waist_controller/command', Float64,
    queue_size=10, latch=True)
waist_controller.publish(1.0)   # Single command / position.
time.sleep(1)

# For controllers other than waist, see the output of
# $ rostopic list
# once the environment (interbotix_ros_gazebo Docker container) is running .

# Iterated command / position.
for data in itertools.count(start=0, step=-0.1):
    waist_controller.publish(data)
    time.sleep(1)

# https://wiki.ros.org/rospy/Overview/Initialization%20and%20Shutdown
# rospy.spin()  # Uncomment to keep this script running.
